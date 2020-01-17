const request = require('postman-request')
const xml2js = require('xml2js')
const fs = require('fs')
const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
})
const {exec} = require('child_process')

try {
    fs.mkdirSync('video')
} catch (e) {}
let video = fs.readdirSync('video')[0]
if(! video) {
    console.log('no video')
    return
}

let chrome = '"C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe"'

readline.question('oid?\n', oid => {
    request({
        url: 'https://api.bilibili.com/x/v1/dm/list.so?oid=' + oid,
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