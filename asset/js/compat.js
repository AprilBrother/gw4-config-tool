let v = () => {
    return indexViewModel.curTreeNodeInfo.data.firmwareVer
}

let supports = feature => {
    switch (feature) {
        case 'metadata':
            return v() > '1.5.2'
        default:
            return false
    }
    return false
}

module.exports = {
    supports: supports
};
