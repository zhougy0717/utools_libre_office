const http = require('http');

utools.onPluginEnter(({code, type, payload, option}) => {
  console.log('用户进入插件应用', code, type, payload)
})

function debounce(func, wait) {
  let timeout;

  // 返回一个新的函数，用于实际调用
  return function(...args) {
      // 保存上下文和参数，供后续使用
      const context = this;

      // 如果已经设定了等待执行的函数，则清除之前的计时器
      if (timeout) clearTimeout(timeout);

      // 设定一个新的计时器
      // 计时器结束后，执行实际的函数
      timeout = setTimeout(() => {
          // func.apply(context, args);
          func(...args)
      }, wait);
  };
}

const langDict = {
  en: 'English',
  zh: '中文'
}
sendReq = (query, cb) => {
  // 要发送的数据对象
  const data = {
    q: query.text,
    source: "auto",
    target: query.target,
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
            cb(parsedData)
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
}

const sendReqDebounced = debounce(sendReq, 300)

window.exports = {
  'utools_libre_translate': {
    mode: 'list',
    args: {
      enter: (action, callbackSetList) => {
        return callbackSetList([])
      },
      search: (action, searchWord, callbackSetList) => { 
        sendReqDebounced({
          text:searchWord,
          target: 'zh'
         }, (resp) => {
          const detectedLang = resp.detectedLanguage.language
          callbackSetList([{
            "title": resp.translatedText,
            "description": `${langDict[detectedLang]} => ${langDict['zh']}`,
            "icon": "logo.png"
          }])
        })
      },
      select: (action, itemData) => {
        window.utools.hideMainWindow()
      },
      placeholder: "输入字符，回车翻译"
    }
  }
}
