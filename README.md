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
        callee: '__setname__'
      }
    ]
  ]
}
```

- includes: 需要设置函数名的包
- callee: 设置函数名的方法名(default: _GIO_DI_NAME_)

