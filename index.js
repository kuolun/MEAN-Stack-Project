
// 取得許多controller function
var controllers = require('./controllers');
// 取得許多directive function
var directives = require('./directives');
// 取得user data-$user
var services = require('./services');

var _ = require('underscore');

// 建立mean-retail.components module
var components = angular.module('mean-retail.components', ['ng']);

// 把controller都include
_.each(controllers, function(controller, name) {
    components.controller(name, controller);
});

//把directive都include
_.each(directives, function(directive, name) {
    components.directive(name, directive);
});

_.each(services, function(factory, name) {
    components.factory(name, factory);
});

var app = angular.module('mean-retail', ['mean-retail.components', 'ngRoute']);

app.config(function($routeProvider) {
    $routeProvider.
    //首頁
    when('/', {
        templateUrl: 'templates/search_bar.html'
    }).
    //分類頁面
    when('/category/:category', {
        templateUrl: 'templates/category_view.html'
    }).
    //結帳頁面
    when('/checkout', {
        template: '<checkout></checkout>'
    }).
    //product頁面
    when('/product/:id', {
        template: '<product-details></product-details>'
    });
});
