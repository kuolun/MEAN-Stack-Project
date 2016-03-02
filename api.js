var bodyparser = require('body-parser');
var express = require('express');
var status = require('http-status');
var _ = require('underscore');

module.exports = function(wagner) {
    var api = express.Router();


    //TODO
    //api.get('/products',function(req,res))--載入所有產品

    //取得特定category資料
    //有req到此path時，傳進來的wagner內有Category model，可invoke
    api.get('/category/id/:id', wagner.invoke(function(Category) {
        return function(req, res) {
          //用:id當條件，search result為category
          Category.findOne({ _id: req.params.id }, function(error, category) {
            if (error) {
              return res.
                status(status.INTERNAL_SERVER_ERROR).
                json({ error: error.toString() });
            }
            if (!category) {
              return res.
                status(status.NOT_FOUND).
                json({ error: 'Not found' });
            }
            res.json({ category: category });
          });
        };
    }));

    //用id找product
    api.get('/product/id/:id', wagner.invoke(function(Product) {
        return function(req, res) {
            Product.findOne({ _id: req.params.id },
                handleOne.bind(null, 'product', res));
        };
    }));

    //用category id找出其下所有categories
    api.get('/product/category/:id', wagner.invoke(function(Product) {
        return function(req, res) {

            //設定sort用的object
            //預設用name排序
            var sort = { name: 1 };
            //如果price有值代表要用price排序
            if (req.query.price === "1") {
                sort = { 'internal.approximatePriceUSD': 1 };
            } else if (req.query.price === "-1") {
                sort = { 'internal.approximatePriceUSD': -1 };
            }

            //search->sort->execute
            Product.
            find({ 'category.ancestors': req.params.id }).
            sort(sort).
            exec(handleMany.bind(null, 'products', res));
        };
    }));

    //根據傳入的category，找parent=category的那些目錄
    api.get('/category/parent/:id', wagner.invoke(function(Category) {
        return function(req, res) {
          //找parent為:id的，並根據id排序
          Category.
            find({ parent: req.params.id }).
            sort({ _id: 1 }).
            exec(function(error, categories) {
              if (error) {
                return res.
                  status(status.INTERNAL_SERVER_ERROR).
                  json({ error: error.toString() });
              }
              res.json({ categories: categories });
            });
        };
    }));


    api.use(bodyparser.json());

    //更新User的cart
    api.put('/me/cart', wagner.invoke(function(User) {
        return function(req, res) {
            var cart;
            try {
                //取得傳進來的cart
                cart = req.body.data.cart;
            } catch (e) {
                return res.
                status(status.BAD_REQUEST).
                json({ error: 'No cart specified!' });
            }

            //如果req.body.data.cart存在
            //把request裡，req.body.data.cart設定給user.data.cart
            req.user.data.cart = cart;
            req.user.save(function(error, user) {
                if (error) {
                    return res.
                    status(status.INTERNAL_SERVER_ERROR).
                    json({ error: error.toString() });
                }
                //回傳user
                return res.json({ user: user });
            });
        };
    }));

    //顯示user資料
    api.get('/me', function(req, res) {
        if (!req.user) {
            return res.
            status(status.UNAUTHORIZED).
            json({ error: 'Not logged in' });
        }

        //req.user傳來一筆資料，要join的path是data.cart.product，去Product找對應的ObjectId並替換
        //執行完query後，回傳res丟到handleOne去處理;
        req.user.populate({ path: 'data.cart.product', model: 'Product' }, 
            handleOne.bind(null, 'user', res));
    });

    //結帳(接收一個Stripe object)
    api.post('/checkout', wagner.invoke(function(User, Stripe) {
        return function(req, res) {
            //User未登入
            if (!req.user) {
                return res.
                status(status.UNAUTHORIZED).
                json({ error: 'Not logged in' });
            }

            // Populate user's cart裡的product
            req.user.populate({ path: 'data.cart.product', model: 'Product' }, function(error, user) {

                // 加總價格 in USD
                var totalCostUSD = 0;
                // iterate每個user的cart
                _.each(user.data.cart, function(item) {
                    totalCostUSD += item.product.internal.approximatePriceUSD *
                        item.quantity;
                });

                // 根據價格建立一個Stripe charge object
                // source要放傳入的token
                Stripe.charges.create({
                        //Stripe的價格要用cents所以x100且四捨五入
                        amount: Math.ceil(totalCostUSD * 100),
                        currency: 'usd',
                        source: req.body.stripeToken,
                        description: 'Example charge from kuolun'
                    },
                    //成功的話會拿到charge object
                    function(err, charge) {
                        if (err && err.type === 'StripeCardError') {
                            return res.
                            status(status.BAD_REQUEST).
                            json({ error: err.toString() });
                        }
                        if (err) {
                            console.log(err);
                            return res.
                            status(status.INTERNAL_SERVER_ERROR).
                            json({ error: err.toString() });
                        }

                        req.user.data.cart = [];
                        req.user.save(function() {
                            // Ignore any errors - if we failed to empty the user's
                            // cart, that's not necessarily a failure

                            // 成功的話回傳id及狀態
                            return res.json({ id: charge.id ,status:charge.status});
                        });
                    });
            });
        };
    }));

    //text search
    api.get('/product/text/:query', wagner.invoke(function(Product) {
        return function(req, res) {
            Product.
            find({ $text: { $search: req.params.query } }, { score: { $meta: 'textScore' } }).
            sort({ score: { $meta: 'textScore' } }).
            limit(10).
            exec(handleMany.bind(null, 'products', res));
        };
    }));

    return api;
};

function handleOne(property, res, error, result) {
    if (error) {
        return res.
        status(status.INTERNAL_SERVER_ERROR).
        json({ error: error.toString() });
    }
    if (!result) {
        return res.
        status(status.NOT_FOUND).
        json({ error: 'Not found' });
    }
    //建立一Object，把找到的result設定為該Object的屬性，然後回傳
    var json = {};
    json[property] = result;
    res.json(json);
}

//處理多筆資料
function handleMany(property, res, error, result) {
    if (error) {
        return res.
        status(status.INTERNAL_SERVER_ERROR).
        json({ error: error.toString() });
    }
    //no error,回傳json物件，有property屬性
    var json = {};
    //建立一個products陣列，儲存特定目錄的product
    json[property] = result;
    res.json(json);
}
