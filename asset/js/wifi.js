function doneCallback() {
    let storage = window.localStorage;
    let compat = require('./asset/js/compat')

    function isValidSsid(str) { 
        if (str.length == 0) {
            return true;
        }
        return true;
    }

    function isValidWpa(str) { 
        return /^[\u0020-\u007e\u00a0-\u00ff]*$/.test(str); 
    }

    if (!compat.supports('modem-auth')) {
        $('#cont-modem-auth').hide()
    }

    if (!compat.supports('ping')) {
        $('#cont-ping').hide()
    }

    $("#btn-conn").click(function() {
        var len = $("#passcode").val().length;
        if((len > 0) && (len  < 8)) {
            alert("The passcode length for WiFi must greater than 7");
            return false;
        }

        if (!isValidSsid($("#ssid").val())) {
            alert("The SSID is not valid");
            return false;
        }

        if (!isValidWpa($("#passcode").val())) {
            alert("The passcode is not valid");
            return false;
        }

        if (!isValidWpa($("#eap-passcode").val())) {
            alert("The EAP password is not valid");
            return false;
        }

        postDeviceApi('/connection', $("form#f-conn").serialize())
            .done((data) => {
                showDialog('Network', {
                    htmlContent: 'Changes have been saved.'
                })
            });
    });

    $("#ssids").change(function() {
        $("#ssid").val(this.value);
    });

    getDeviceApi("/connection", "json").done((data) => {
        var apEnabled = 3;
        var wifiType = typeof data["wifi-type"] == "undefined" ? 0 : data["wifi-type"];
        $("#ssid").val(data.ssid);
        $("#passcode").val(data.passcode);
        $("#wifi-type").val(wifiType);
        $("#eth-dhcp").val(data['eth-dhcp']);
        $("#eth-ip").val(data['eth-ip']);
        $("#eth-gateway").val(data['eth-gateway']);
        $("#eth-netmask").val(data['eth-netmask']);
        $("#dns-main").val(data['dns-main']);
        $("#dns-backup").val(data['dns-backup']);
        $("#dns-fallback").val(data['dns-fallback']);
        $("#eap-identity").val(data['eap-identity']);
        $("#eap-username").val(data['eap-username']);
        $("#eap-passcode").val(data['eap-passcode']);
        $("#modem-mcc").val(data['modem-mcc']);
        $("#modem-mnc").val(data['modem-mnc']);
        $("#wifi-type").change();
        $("#eth-dhcp").change();

        if (typeof data['modem-apn'] == "undefined") {
            $('#cont-modem').hide();
        } else {
            $('#cont-modem').show();
            $('#modem-apn').val(data['modem-apn']);
            if (data['modem-imei'].length) {
                $('.cont-imei').text(data['modem-imei']);
            }
            if (data['modem-iccid'].length) {
                $('.cont-iccid').text(data['modem-iccid']);
            }
        }

        if (compat.supports('modem-auth')) {
            $("#modem-user").val(data['modem-user']);
            $("#modem-pass").val(data['modem-pass']);
            $("#modem-auth").val(data['modem-auth']);
        }

        if (compat.supports('ping')) {
            $('#ping').val(data['ping'])
        }

        if (!data.passcode.length) {
            $("open-wifi").prop("checked", true);
        }
    });

    $("#f-conn")[0].action="http://"+indexViewModel.curTreeNodeInfo.ip+"/connection";
}

$("#open-wifi").change(function() {
    if ($(this).is(":checked")) {
        $("#passcode").prop("disabled", true);
    } else {
        $("#passcode").prop("disabled", false);
    }
});

$("#wifi-type").change(function() {
    if (this.value == 1) {
        $("#eap-group").show();
        $("#wpa-group").hide();
    } else {
        $("#eap-group").hide();
        $("#wpa-group").show();
    }
});

$("#eth-dhcp").change(function() {
    if (this.value == 1) {
        $('#eth-ip-group').hide();
    } else {
        $('#eth-ip-group').show();
    }
});

if (window.jQuery) {
    doneCallback();
}

