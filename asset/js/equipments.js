/**
 * load gateways
 */
const fs=require('fs');
const os=require('os');
const path = require('path'), 
    timeoutSignal = require('timeout-signal'),
    fetch = require('node-fetch');
const {ipcRenderer} = require('electron');
const storage = window.localStorage;

window.KEY_DEFAULT_CONFIG = "__def_conf";

function configApp(nodeInfo) {
    $('.splash-container').hide();
    $("#details").load("./html/index.htm")
}

function clearDevices() {
    $('.sel-gw').html('');
}

var renderDeviceItem = (host, data) => {
    if(data && data.mac && data.hardwareVer && data.hardwareVer.startsWith("4.")) {
        var suffix = data.mac.replace(/:/g, "");
        var item = `<li class="pure-menu-item"><a href="#" data-host="${host}" class="pure-menu-link gw-item">Gateway-${suffix}</a></li>`;
        $('.sel-gw').append(item);
        var filter = $('#gw-mac').val();
        if (filter.length) {
            filter = filter.toUpperCase();
            if (suffix.includes(filter)) {
                item.show();
            } else {
                item.hide();
            }
        }
    }
};

var fetchDeviceInfo = (end_addr) => {
    var addr = `http://${end_addr}/info`;
    fetch(addr, {signal: timeoutSignal(5000)})
        .then(res => res.json())
        .then(json => renderDeviceItem(end_addr, json))
        .catch(err => {});
};

function loadGateways(node) {
    var interfaces=os.networkInterfaces();
    var ips=[];
    for(var intf in interfaces) {
        if(interfaces[intf][0].mac.internal === true)
            continue;

        ips=ips.concat(interfaces[intf].filter(function(e){
            if((e.family === "IPv4") && (e.internal == false) && !e.address.startsWith("169.254")) {
                return true;
            }
            return false;
        }))
    }

    if ($('#discover-ip').val()) {
        ips = [{
            netmask: "255.255.255.0",
            address: $('#discover-ip').val()
        }];
    }

    var prefix;
    ips.forEach(function(e){
        var _start = 0,
            _end = -1,
            mask=0;
        s_mask=e.netmask+".";
        for(var i=0;i<4;i++) {
            _start=_end+1;
            _end=s_mask.indexOf(".",_start);
            mask=(mask<<8)+parseInt(s_mask.substring(_start,_end));
        }
        _start=0;
        _end=-1;
        ip=0;
        s_addr=e.address+".";

        if (!$('#discover-ip').val()) {
            $('#discover-ip').val(e.address);
        }

        for(var i=0;i<4;i++) {
            _start=_end+1;
            _end=s_addr.indexOf(".",_start);
            ip=(ip<<8)+parseInt(s_addr.substring(_start,_end));
        }
        var base=mask & ip;
        ip=base;
        start_addr=(0xFF&(ip>>24)).toString()+"."+(0xFF&(ip>>16))+"."+(0xFF&(ip>>8))+"."+(ip&255);

        clearDevices();
        for(;(mask & ip) == base;ip++) {
            end_addr = (0xFF&(ip>>24)).toString() + 
                "." +
                (0xFF&(ip>>16)) +
                "." +
                (0xFF&(ip>>8)) +
                "." + 
                (ip&255);

            fetchDeviceInfo(end_addr);
        }

        setTimeout(function() {
            $(".btn-reload")
                .text("Reload")
                .prop("disabled", false);
        }, 15000);
    });
};

window.indexViewModel = {}

var batchUpdate = () => {
    $('.btn-batch-update')
        .text("Updating...")
        .prop("disabled", true);
    $('ul.sel-gw li a').each((i, elt) => {
        var host = $(elt).data('host');
        var url = 'http://' + host + '/update';
        console.log(url);
        fetch(url, {method: 'POST', body: 'update=1'})
            .then(res => res.text())
            .then(body => console.log(body))
    });

    setTimeout(function() {
        $(".btn-batch-update")
            .text('Batch Update')
            .prop("disabled", false);
    }, 15000);
};

window.appendAuthHeader = (opt) => {
    if (typeof indexViewModel.curTreeNodeInfo.data.auth != "undefined") {
        if (indexViewModel.curTreeNodeInfo.data.auth) {
            var user = storage.getItem('auth-username'),
                pass = storage.getItem('auth-password');

            opt.headers = {
                'Authorization': 'Basic ' + btoa(`${user}:${pass}`)
            };
        }
    } else {
        console.log("No auth info");
    }
};

window.postDeviceApi = (uri, postData) => {
    var opt = {
        method: 'POST',
        data: postData,
        url: "http://" + indexViewModel.curTreeNodeInfo.ip + uri
    };
    appendAuthHeader(opt);
    return $.ajax(opt);
};

window.getDeviceApi = (uri, dataType) => {
    var opt = {
        "dataType": dataType,
        url: "http://" + indexViewModel.curTreeNodeInfo.ip + uri
    };
    appendAuthHeader(opt);
    return $.ajax(opt);
};

window.showLogin = function() {
    let node = indexViewModel.curTreeNodeInfo.data
    let mac = node.mac
    let uKey = `cur-username@${mac}`
    let pKey = `cur-password@${mac}`

    showDialog("Authentication required", {
        html: './html/auth_form.htm',
        cb: function() {
            let u = storage.getItem('auth-username'),
                p = storage.getItem('auth-password')

            let ui = $('#cur-username')
            let pi = $('#cur-password')
            ui.val(u)
            pi.val(p)
            $("#f-auth").off('click', 'button.btn-auth')
            $('#f-auth').on('click', 'button.btn-auth', function() {
                storage.setItem(uKey, ui.val())
                storage.setItem(pKey, pi.val())
                $("#popupMsg").dialog("close")
                alert('Authencatation data is ready. Go ahead')
            })
        }
    })
}

window.checkAuthData = function() {
    if (typeof indexViewModel.curTreeNodeInfo.data.auth == "undefined") 
        return true

    if (indexViewModel.curTreeNodeInfo.data.auth) {
        let node = indexViewModel.curTreeNodeInfo.data
        let mac = node.mac
        let uKey = `cur-username@${mac}`
        let pKey = `cur-password@${mac}`
        let user = storage.getItem(uKey),
            pass = storage.getItem(pKey);

        if ($.isEmptyObject(user) || $.isEmptyObject(pass)) {
            showLogin()
            return false
        }
    }

    return true
}

window.showDialog = function(title, options) {
    let settings = $.extend({
        htmlContent: '',
        html: '',
        cb: null,
    }, options);

    let pop = $("#popupMsg")
    pop.html('')
    if (settings.htmlContent.length) {
        pop.html(settings.htmlContent)
    } else if (settings.html.length) {
        pop.load(settings.html, settings.cb)
    }

    pop.dialog({
        position: {my: 'center', at: 'center', of: $('div.content')},
        title: title,
        modal: true
    })
}

jQuery(function( $ ) {
    var params={};
    window.location.search.slice(1).split("&").forEach(function(e){
        v_k=e.split("=");
        params[v_k[0]]=v_k[1];
    })
    var lang="en";
    window.config={locale:lang};
    loadGateways();

    $('#btn-logo').click(function() {
        ipcRenderer.send("showAppVersion");
    });

    $('.btn-reload').click(function() {
        $('.btn-reload').text("Loading");
        $(".btn-reload").prop("disabled", true);
        clearDevices();
        loadGateways();
    });

    $('.btn-filter').click(() => {
        $('div.gw-more').hide();
        $('div.gw-filter').toggle(400);
    });

    $('.btn-more').click(() => {
        $('div.gw-filter').hide();
        $('div.gw-more').toggle(400);
    });

    $('#gw-mac').on('input', function() {
        var mac = $(this).val();
        if (!mac.length) {
            $('ul.sel-gw li').show();
            return;
        }

        mac = mac.toUpperCase();
        $('ul.sel-gw li').each((i, elt) => {
            if ($(elt).text().includes(mac)) {
                $(elt).show();
            } else {
                $(elt).hide();
            }
        });

    });

    $('.sel-gw').off('click', 'a.gw-item');
    $('.sel-gw').on('click', 'a.gw-item', (e) => {
        $('div.header').hide();
        var host = $(e.target).data('host');
        $('.sel-gw li').removeClass('pure-menu-selected');
        $(e.target).parent().addClass('pure-menu-selected');
        showDialog('Info', {
            htmlContent: "<p>Loading...</p><div id=bar></div>"
        })
        $("#bar").progressbar({
            value: false
        });
        $("#bar").progressbar("option", "value", false);

        var nodeInfo = {
            ip: host
        };
        indexViewModel.curTreeNodeInfo = nodeInfo;
        configApp(nodeInfo);
    });

    $('.btn-batch-update').click(batchUpdate);

    $('.btn-update-tool').click(() => {
        console.log("update tool");
        ipcRenderer.send("checkForUpdate");
    });

    // read config 
    $('#auth-username').val(storage.getItem('auth-username'));
    $('#auth-password').val(storage.getItem('auth-password'));
    $('#auth-username').change(() => storage.setItem('auth-username', $('#auth-username').val())); 
    $('#auth-password').change(() => storage.setItem('auth-password', $('#auth-password').val())); 
});
