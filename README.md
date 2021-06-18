## babel-plugin-setname

> 为匿名函数设置函数名

### 使用

```sh
npm install babel-plugin-setname --save-dev
```

修改babel配置，如`babel.config.js`

```javascript
module.exports = {
  plugins: [
    [
      "babel-plugin-setname",
      {
        includes: ["src"],
        callee: '__setname__',
        package: '@gio/setname',
        lower: false,
        test: /^on[A-Z][a-zA-Z]+/
      }
    ]
  ]
}
```

- includes: 需要设置函数名的包
- callee: 设置函数名的方法名(default: `_GIO_DI_NAME_`)
- package: 设置提供setname函数的包(default: `babel-plugin-setname/lib/setname`)
- lower: 如果是从Taro2升级来的，可以配置为true已能兼容大部分的已圈选的无埋点事件（无法完全）
- test: 自定义要转换的jsx属性(default: `/^on[A-Z][a-zA-Z]+/`)
