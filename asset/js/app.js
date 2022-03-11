function doneCallback() {
    let storage = window.localStorage;
    var compat = require('./asset/js/compat')

    let configKeys = [
        'req-int', 
        'http-url', 
        'mqtt-username', 
        'mqtt-password', 
        'mqtt-topic',
        'mqtt-config',
        'mqtt-retain',
        'mqtt-qos',
        'cfg-topic',
        'one-cfg-topic',
        'one-pub-topic',
        'mqtt-id-prefix',
        'mqtts',
        'https',
        'wss',
        'min-rssi', 
        'data-format', 
        'conn-type', 
        'dup-filter', 
        'adv-filter',
        'scan-act',
        'filter-uuid',
        'filter-mfg',
        'req-format',
        'metadata',
        'ntp-enabled',
        'ntp1',
        'ntp2' 
    ], formKeys = [ 
        'ws-host',
        'http-host',
        'mqtt-host',
        'ws-port',
        'http-port',
        'mqtt-port',
        'ws-url'
    ];

    var nodeIp = indexViewModel.curTreeNodeInfo.ip;

    function hideAll() {
        $("#cont-ws-client").hide();
        $("#cont-http-client").hide();
        $("#cont-mqtt-client").hide();
    }

    function loadDefault() {
        var k, keys = formKeys.concat(configKeys),
            defaultConfig = window.localStorage.getItem(KEY_DEFAULT_CONFIG);

        if (defaultConfig == null) {
            return;
        }

        defaultConfig = JSON.parse(defaultConfig);
        for (var i = 0; i < keys.length; i++) {
            k = keys[i];
            $('#' + k).val(defaultConfig[k]);
        }

        $('#conn-type').change();
    }

    function storeDefault() {
        var k, newConfig = {}, 
            keys = formKeys.concat(configKeys);
        for (var i = 0; i < keys.length; i++) {
            k = keys[i];
            newConfig[k] = $('#' + k).val();
        }
        window.localStorage.setItem(KEY_DEFAULT_CONFIG, JSON.stringify(newConfig));
        $("#popupMsg").html("<p>Default config are saved.</p>");
        $("#popupMsg").dialog({
            title: "Info"
        });
    }

    hideAll();
    $("#btn-clear").hide();
    $("#conn-type").change(function() {
        switch(parseInt(this.value)) {
            case 0:
                hideAll();
            break;

            case 1:
                hideAll();
                $("#cont-ws-client").show();
            break;

            case 2:
                hideAll();
                $("#cont-http-client").show();
            break;

            case 3:
                hideAll();
                $("#cont-mqtt-client").show();
            break;
        }
    });

    $('#ws-url').change(() => {
        $('#http-url').val($('#ws-url').val());
    });

    $('#mqtt-config').change(() => {
        if ($('#mqtt-config').val() == '0') {
            $('#cont-cfg-topic').hide();
        } else {
            $('#cont-cfg-topic').show();
        }
    });

    $('#adv-filter').change(() => {
        switch(parseInt($('#adv-filter').val())) {
        case 0:
        $("#cont-uuid-filter").hide();
        $("#cont-mfg-filter").show();
        break;

        // iBeacon filter
        case 1:
        case 11:
        $("#cont-mfg-filter").hide();
        $("#cont-uuid-filter").show();
        break;

        default:
        $("#cont-uuid-filter").hide();
        $("#cont-mfg-filter").hide();
        }
    });

    $('#mfg').change(() => {
        var mfg = $('#mfg').val();
        $('#filter-mfg').val(parseInt(mfg, 16));
    });


    $('#sel-min-rssi').change(function() {
        $('#min-rssi').val($('#sel-min-rssi').val());
    });

    var opt = {
        dataType: "json",
        cache: false,
        url: "http://"+indexViewModel.curTreeNodeInfo.ip+"/config"
    };
    appendAuthHeader(opt);
    $.ajax(opt).done((data) => {
        var k;
        if (!data['http-url'].length) {
            data['http-url'] = '/';
        }

        if (typeof data['boot-period'] == 'undefined') {
            $("#cont-auto-restart").hide();
        }

        if (typeof data['mqtts'] == 'undefined') {
            $("#cont-mqtts").hide();
        }

        if (typeof data['https'] == 'undefined') {
            $("#cont-https").hide();
        }

        if (typeof data['wss'] == 'undefined') {
            $("#cont-wss").hide();
        }

        if (typeof data['mqtt-qos'] == 'undefined') {
            $("#cont-qos").hide();
        }

        if (typeof data['mqtt-retain'] == 'undefined') {
            $("#cont-retain").hide();
        }

        if (typeof data['req-format'] == 'undefined') {
            $("#cont-req-format").hide();
        }

        if (typeof data['ntp-enabled'] == 'undefined') {
            $("#cont-ntp").hide();
        }

        if (typeof data['mqtt-config'] == 'undefined') {
            $("#cont-mqtt-config").hide();
        }

        for (var i = 0; i < configKeys.length; i++) {
            k = configKeys[i];
            $('#' + k).val(data[k]);
        }
        $('#ws-host').val(data['host']);
        $('#http-host').val(data['host']);
        $('#mqtt-host').val(data['host']);
        $('#ws-port').val(data['port']);
        $('#http-port').val(data['port']);
        $('#mqtt-port').val(data['port']);
        $('#ws-url').val(data['http-url']);

        $('#conn-type').change();
        $('#adv-filter').change();
        $('#mqtt-config').change();
        $('#req-format').change();

        $('#sel-min-rssi').val($('#min-rssi').val());

        var storage = window.localStorage,
            defaultConfig = storage.getItem(KEY_DEFAULT_CONFIG);

        if (defaultConfig != null) {
            $("#btn-default").text("Default");
            $("#btn-clear").show();
            defaultConfig = JSON.parse(defaultConfig);
        }

        $('#btn-default').click(function() {
            if($(this).text() == "Default") {
                loadDefault();
            } else {
                storeDefault();
                $(this).text("Default");
                $("#btn-clear").show();
            }
        });

        setTimeout(function() {
            $.get("http://"+nodeIp+"/filter_mac", {s:new Date().getTime()}, function(filterData)
            {
                var ks = filterData.split("\n"),
                    cnt = ks.length;

                for (var i = 0; i < cnt; i++) {
                    ks[i] = $.trim(ks[i]);
                    if (ks[i].length != 12) {
                        delete ks[i];
                        continue;
                    }
                }
                var realData = ks.join("\n");
                $("#mac").val(realData);
            });
        }, 200);
    });

    $('#btn-clear').click(function() {
        window.localStorage.removeItem(KEY_DEFAULT_CONFIG);
        $("#btn-default").text("Save As Default");
        $(this).hide();
    });

    $('#req-int').change(function() {
        if ($(this).val() > 1800) {
            $(this).val(1800);
        } else if ($(this).val() < 1) {
            $(this).val(1);
        } else {
            $(this).val(parseInt($(this).val()));
        }
    });

    $('#req-format').change(function() {
        if ($(this).val() == 0) {
            $('#cont-metadata').hide()
        } else if (compat.supports('metadata')) {
            $('#cont-metadata').show()
        }
    })

    $('#ws-port, #http-port, #mqtt-port').change(function() {
        if ($(this).val() > 65535) {
            $(this).val(65535);
        } else if ($(this).val() < 80) {
            $(this).val(80);
        } else {
            $(this).val(parseInt($(this).val()));
        }
    });

    var validateForm = () => {
        var connType = $('#conn-type').val();
        switch(connType) {
            case "1":
                if (!$('#ws-url').val().length) {
                    alert("URI cannot be empty");
                    return false;
                }
                break;

            case "2":
                if (!$('#http-url').val().length) {
                    alert("URI cannot be empty");
                    return false;
                }
                break;

            default:
                break;
        }

        var meta = $('#metadata').val()
        if (meta.length) {
            try {
                JSON.parse(meta)
            } catch (e) {
                alert("Custom metadata is invalid");
                return false;
            }
        }

        return true
    }

    $("#f-app")[0].action="http://"+indexViewModel.curTreeNodeInfo.ip+"/config";
    $("#btn-save-app").click(function() {
        if (validateForm()) {
            postDeviceApi("/config", $('#f-app').serialize())
                .done(data => $("#saveWifiMsg").dialog());
        }
    });

    var genRequestOption = dstUri => {
        var opt = {
            url: "http://" + nodeIp + dstUri
        };
        appendAuthHeader(opt);
        return opt;
    };

    $(".btn-cert").click(() => {
        $("#popupMsg").load('html/cert_form.htm');
        $("#popupMsg").dialog({
            title: "Setup Certificate",
            width: 650
        });

        getDeviceApi("/config/ca_cert", "text").done(data => $("#ca-cert").val(data))
            .then(() => {
                return getDeviceApi("/config/client_cert", "text").done(data => {
                    $("#client-cert").val(data);
                });
            }).then(() => {
                return getDeviceApi("/config/client_key", "text").done(data => {
                    $("#client-key").val(data);
                });
            });
    });

    $("#popupMsg").off('click', 'button.btn-save-cert');
    $("#popupMsg").off('click', 'button.btn-save-client-cert');
    $("#popupMsg").off('click', 'button.btn-save-client-key');
    $("#popupMsg").off('click', 'li.pure-menu-item a');

    $("#popupMsg").on('click', 'button.btn-save-cert', () => {
        console.log("save cert");
        postDeviceApi("/config/ca_cert", {"ca-cert": $("#ca-cert").val()})
            .done(data => $("#popupMsg").html('<p>Saved</p>'));
    });

    $("#popupMsg").on('click', 'button.btn-save-client-cert', () => {
        postDeviceApi("/config/client_cert", {"client-cert": $("#client-cert").val()})
            .done(data => $("#popupMsg").html('<p>Saved</p>'));
    });

    $("#popupMsg").on('click', 'button.btn-save-client-key', () => {
        postDeviceApi("/config/client_key", {"client-key": $("#client-key").val()})
            .done(data => $("#popupMsg").html('<p>Saved</p>'));
    });

    $("#popupMsg").on('click', 'a.menu-ca-cert', () => {
        $('#f-cert').show();
        $('#f-client-cert, #f-client-key').hide();
    });

    $("#popupMsg").on('click', 'a.menu-client-cert', () => {
        $('#popupMsg ul li').removeClass("pure-menu-selected");
        $('#f-client-cert').show();
        $('#f-client-cert').removeClass("hidden");
        $('#f-cert, #f-client-key').hide();
    });

    $("#popupMsg").on('click', 'a.menu-client-key', () => {
        $('#popupMsg ul li').removeClass("pure-menu-selected");
        $('#f-client-key').show();
        $('#f-client-key').removeClass("hidden");
        $('#f-client-cert, #f-cert').hide();
    });

    $("#f-filter-mac")[0].action="http://"+nodeIp+"/filter_mac";
    $("#btn-save-mac").click(function() {
        $.ajax({
            type: "POST",
            url: "http://"+nodeIp+"/filter_mac",
            data: $("form#f-filter-mac").serialize(),
            success: function(data) {
                $("#saveWifiMsg").dialog();
            }
        });
    });
}

doneCallback();
