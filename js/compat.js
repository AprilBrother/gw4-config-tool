const compareVersions = require('compare-versions')

let v = () => {
    return indexViewModel.curTreeNodeInfo.data.firmwareVer.replace('i', '')
}

function versionBetween(ver, v1, v2) {
    return ((compareVersions(ver, v1) >= 0) && (compareVersions(ver, v2) < 0)) 
}

let supports = feature => {
    let ret = false
    let ver = v()
    switch (feature) {
        case 'metadata':
            ret = compareVersions(ver, '1.5.2')
        break
        case 'schedule':
            ret = compareVersions(ver, '1.5.6')
        break
        case 'modem-auth':
            ret = compareVersions(ver, '1.5.7')
        break
        case 'ping':
            ret = compareVersions(ver, '1.5.9')
        break
        case 'hb-int':
            ret = compareVersions(ver, '1.5.16')
        break
        case 'tcp':
            ret = compareVersions(ver, '1.5.22')
        break
        case 'phy':
            return versionBetween(ver, '1.7.0', '1.8.0')
        case 'local':
            return versionBetween(ver, '1.8.0', '1.9.0')
        case 'gatt':
            ret = compareVersions(ver, '2.0.0')
        break
        default:
        return false
    }
    return ret >= 0 ? true : false
}

module.exports = {
    supports: supports
};
