const compareVersions = require('compare-versions')

let v = () => {
    return indexViewModel.curTreeNodeInfo.data.firmwareVer.replace('i', '')
}

let supports = feature => {
    switch (feature) {
        case 'metadata':
            return compareVersions(v(), '1.5.2')
        case 'schedule':
            return compareVersions(v(), '1.5.6')
        case 'modem-auth':
            return compareVersions(v(), '1.5.7')
        case 'ping':
            return compareVersions(v(), '1.5.9')
        default:
            return false
    }
    return false
}

module.exports = {
    supports: supports
};
