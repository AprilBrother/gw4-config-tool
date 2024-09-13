const compareVersions = require('compare-versions')

let v = () => {
    return indexViewModel.curTreeNodeInfo.data.firmwareVer.replace('i', '')
}

let supports = feature => {
    let ret = false
    switch (feature) {
        case 'metadata':
            ret = compareVersions(v(), '1.5.2')
        break
        case 'schedule':
            ret = compareVersions(v(), '1.5.6')
        break
        case 'modem-auth':
            ret = compareVersions(v(), '1.5.7')
        break
        case 'ping':
            ret = compareVersions(v(), '1.5.9')
        break
        case 'hb-int':
            ret = compareVersions(v(), '1.5.16')
        break
        case 'local':
            ret = compareVersions(v(), '1.8.0')
        case 'gatt':
            ret = compareVersions(v(), '2.0.0')
        break
        default:
        return false
    }
    return ret >= 0 ? true : false
}

module.exports = {
    supports: supports
};
