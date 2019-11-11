/**
 * load gateways
 */

const chile_process=require('child_process');
const fs=require('fs');
const os=require('os');
const path = require('path')
const request=require('request');
const dialog = require('electron').remote.dialog;

window.KEY_DEFAULT_CONFIG = "__def_conf";

var localeText;

function configApp(nodeInfo) {
    $('.splash-container').hide();
	indexViewModel.templateToUse("details-template")
    $("#details").load("./html/index.htm")
}

function clearDevices() {
    $('.sel-gw').html('<option value="0">Find Gateways</option>');
}

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

    var prefix;
    ips.forEach(function(e){
        var _start=0;
        var _end=-1;
        var mask=0;
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

            addr= "http://" + end_addr + "/info";
            request({uri:addr,timeout:20000},function(err,resp,body){
                if(err) 
                    return;

                var data;
                try {
                    data=JSON.parse(body);
                } catch(e) {
                    //console.log(e);
                }

                if(data && data.mac && data.hardwareVer && data.hardwareVer && data.hardwareVer.startsWith("4."))
                {
                    var suffix = data.mac.replace(/:/g, "");
                    $('.sel-gw').append(new Option("gateway-" + suffix, resp.request.host));
                }
            })
        }

        setTimeout(function() {
            $(".btn-reload").
                text("Reload").
                prop("disabled", false);
        }, 15000);
    });
};

window.indexViewModel = {
    wifiAction: ko.observable("a"),
    apAction: ko.observable("a"),
    appAction: ko.observable("a"),
    advancedAction: ko.observable("a"),
    popupMsg: ko.observable(""),
    title: ko.observable(""),
    connInfo: ko.observable("Connection information"),
    templateToUse: ko.observable("details-template")
};

function languageChanged(evt) {
}

jQuery(function( $ ) {
	ko.applyBindings(indexViewModel);
    var params={};
    window.location.search.slice(1).split("&").forEach(function(e){
        v_k=e.split("=");
        params[v_k[0]]=v_k[1];
    })
    var lang="en";
    if(params.locale.startsWith("zh"))lang="zh";
    window.config={locale:lang};
    fs.access(path.join(__dirname, 'config.json'),fs.R_OK,(err)=>{
      if(!err) {
          window.config=require(path.join(__dirname, 'config.json'));
          lang=config.locale;
      }
      loadGateways();
    });

    $('#btn-logo').click(function() {
        dialog.showMessageBox({
            title: "About",
            message: "Version: \tv" + require('electron').remote.app.getVersion() + "\nHome Page: \thttps://aprbrother.com"
        });
    });

    $('.btn-reload').click(function() {
        $('.btn-reload').text("Searching...");
        $(".btn-reload").prop("disabled", true);
        clearDevices();
        loadGateways();
    });

    $('.sel-gw').change(function() {
        if (this.value == 0) {
            $('.splash-container').show();
            return;
        }

        $("#popupMsg").html("<p>Loading...</p><div id=bar></div>");
        $("#popupMsg").dialog({
            modal: true
        });
        $("#bar").progressbar({
          value: false
        });
        $("#bar").progressbar("option", "value", false);

        var nodeInfo = {
            ip: this.value
        };
        indexViewModel.curTreeNodeInfo = nodeInfo;
        configApp(nodeInfo);
    });

});
