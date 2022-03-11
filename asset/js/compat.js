let v = () => {
    return indexViewModel.curTreeNodeInfo.data.firmwareVer
}

let supports = feature => {
    switch (feature) {
        case 'metadata':
            return v() > '1.5.2'
        case 'schedule':
            return v() > '1.5.5'
        default:
            return false
    }
    return false
}

module.exports = {
    supports: supports
};
