const http = require('http');
const querystring = require('querystring');

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
  zh: '中文',
  zt: '繁體中文',
  fr: '法语',
  de: '德语',
  ja: '日语',
  ko: '韩语',
  ru: '俄语',
  es: '西班牙语',
  th: '泰国语',
  it: '意大利语',
  pt: '葡萄牙语',
  ar: '阿拉伯语',
  tr: '土耳其语',
  hi: '印度语'
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
  const jsonData = querystring.stringify(data);

  // 定义请求选项
  const options = {
    hostname: '127.0.0.1',
    port: 9911,
    path: '/translate',
    method: 'POST',
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(jsonData)
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
            cb(data, parsedData)
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
        if(utools.isMacOs()) {
          utools.simulateKeyboardTap('v', 'command')
        }
        if (utools.isWindows() || utools.isLinux()) {
          utools.simulateKeyboardTap('v', 'ctrl')
        }
      
        return callbackSetList([])
      },
      search: (action, searchWord, callbackSetList) => { 
        const handleResp = (req, resp) => {
          const detectedLang = resp.detectedLanguage.language
          if (req.target == detectedLang) {
            sendReq({
              text:searchWord,
              target: 'en'
             }, handleResp)
          }
          else {
            callbackSetList([{
              "title": resp.translatedText,
              "description": `${langDict[detectedLang]} => ${langDict[req.target]}`,
              "icon": "logo.png",
              "action": 'copyText'
            }, {
              "title": 'LibreTranslate',
              "description": 'http://127.0.0.1:9911',
              "icon": "link.png",
              "action": 'openLink'
            }])
          }
        }
        sendReqDebounced({
          text:searchWord,
          target: 'zh'
         }, handleResp)
      },
      select: (action, itemData) => {
        window.utools.hideMainWindow()
        if (itemData.action == 'copyText') {
          utools.copyText(itemData.title)
        }
        if (itemData.action == 'openLink') {
          utools.shellOpenExternal(itemData.description)
        }
      },
      placeholder: "输入字符，回车翻译"
    }
  }
}
