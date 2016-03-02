// 加入購物車
exports.addToCart = function() {
    return {
        controller: 'AddToCartController',
        templateUrl: 'templates/add_to_cart.html'
    };
};

// 分類下的所有產品(含price排序)
exports.categoryProducts = function() {
    return {
        controller: 'CategoryProductsController',
        templateUrl: 'templates/category_products.html'
    };
};

// 分類結構路徑
exports.categoryTree = function() {
    return {
        controller: 'CategoryTreeController',
        templateUrl: 'templates/category_tree.html'
    };
};

// 結帳頁面
exports.checkout = function() {
    return {
        controller: 'CheckoutController',
        templateUrl: 'templates/checkout.html'
    };
};

// 最上方Bar
exports.navBar = function() {
    return {
        controller: 'NavBarController',
        templateUrl: 'templates/nav_bar.html'
    };
};

// 產品細節
exports.productDetails = function() {
    return {
        controller: 'ProductDetailsController',
        templateUrl: 'templates/product_details.html'
    };
};

// 搜尋bar
exports.searchBar = function() {
    return {
        controller: 'SearchBarController',
        templateUrl: 'templates/search_bar.html'
    };
};
