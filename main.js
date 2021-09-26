const chrome = '"C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe"'
const request = require('postman-request')
const xml2js = require('xml2js')
const fs = require('fs')
const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
})
const { exec } = require('child_process')

if (!fs.existsSync(chrome.substr(1, chrome.length - 2))) {
    console.log('wrong chrome path, please correct the chrome path in the first line of main.js')
    return
}
try {
    fs.mkdirSync('video')
} catch (e) {}
let video = fs.readdirSync('video')[0]
if (!video) {
    console.log('no file in video folder')
    return
}

readline.question('bilibili bangumi url ?\n', bUrl => {
    let re = new RegExp('https://www.bilibili.com/bangumi/play/(ep|ss)[0-9]+')
    if (!re.test(bUrl)) {
        console.log('not bilibili bangumi url')
        return
    }
    request({
        url: bUrl,
        gzip: true,
    }, (err, rs, body) => {
        let leftKeyword = 'window.__INITIAL_STATE__='
        let leftIndex = body.indexOf(leftKeyword) + leftKeyword.length
        body = body.substr(leftIndex)
        let json = body.substr(0, body.indexOf(']};') + 2)
        try {
            let info = JSON.parse(json)
            let epList = info.epList
            for (let i = 1; i <= epList.length; i++) {
                console.log(i + ': ' + epList[i - 1].titleFormat + ' ' + epList[i - 1].longTitle)
            }
            readline.question('please choose an episode:\n', episodeNo => {
                let ep = epList[episodeNo - 1]
                if (!ep) {
                    console.log('episode not exists')
                    return
                }
                request({
                    url: 'https://api.bilibili.com/x/v1/dm/list.so?oid=' + ep.cid,
                    gzip: true,
                }, (err, rs, body) => {
                    xml2js.parseString(body, (err, dms) => {
                        dms = dms['i']['d']
                        let dmStr = ''
                        dms.forEach(dm => {
                            dmStr = dmStr + dm['_'].replace(/`/g, '') + '\n' + dm['$']['p'] + ' \n'
                        })
                        let html = fs.readFileSync('index.html').toString()
                        html = html.replace('{{dms}}', dmStr)
                        html = html.replace('{{video}}', 'video/' + video)
                        fs.writeFileSync('target.html', html)
                        exec(chrome + ' "' + process.cwd() + '/target.html"')
                        setTimeout(() => {
                            fs.unlinkSync('target.html')
                        }, 3000)
                    })
                })
            })
        } catch (e) {
            console.log('parse json fail')
            return
        }
    })
})
