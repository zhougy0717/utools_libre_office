const http = require('http');

utools.onPluginEnter(({code, type, payload, option}) => {
  console.log('用户进入插件应用', code, type, payload)
})

// translate.engine = "libre";
// translate.url = '127.0.0.1'

window.exports = {
  'utools_libre_office': {
    mode: 'list',
    args: {
      enter: (action, callbackSetList) => {
       
        return callbackSetList([])
      },
      search: (action, searchWord, callbackSetList) => {
        // 要发送的数据对象
        const data = {
          q: "hello world",
          source: "auto",
          target: "en",
          format: "text",
        };

        // 将数据对象转换为JSON字符串
        const jsonData = JSON.stringify(data);

        // 定义请求选项
        const options = {
          hostname: '127.0.0.1',
          port: 9911,
          path: '/translate',
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              'Content-Length': jsonData.length
          }
        };

        // 创建请求对象
        const req = http.request(options, (res) => {
          console.log(`状态码: ${res.statusCode}`);
          console.log(`响应头: ${JSON.stringify(res.headers)}`);
          res.setEncoding('utf8');
          
          let responseBody = '';

          // 接收数据片段
          res.on('data', (chunk) => {
              responseBody += chunk;
          });

          // 响应结束，处理完整的响应数据
          res.on('end', () => {
              console.log('响应中已无更多数据。');
              try {
                  const parsedData = JSON.parse(responseBody);
                  console.log(parsedData);
              } catch (e) {
                  console.error(e.message);
              }
          });
        });

        // 监听请求错误
        req.on('error', (e) => {
          console.error(`请求遇到问题: ${e.message}`);
        });

        // 写入数据到请求主体
        req.write(jsonData);
        req.end();

        return callbackSetList([])
      },
      select: (action, itemData) => {
        window.utools.hideMainWindow()
      },
      placeholder: "输入字符，回车翻译"
    }
  }
}
