function doneCallback() {
    let storage = window.localStorage;
    var compat = require('./js/compat')

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
        'mqtt-keepalive',
        'mqtts',
        'https',
        'wss',
        'min-rssi', 
        'data-format', 
        'conn-type', 
        'dup-filter', 
        'adv-filter',
        'scan-act',
        'scan-phy',
        'scan-window',
        'filter-uuid',
        'filter-cstm',
        'filter-mfg',
        'req-format',
        'metadata',
        'ntp-enabled',
        'hb-int',
        'loop-save',
        'ntp1',
        'ntp2' 
    ], formKeys = [ 
        'ws-host',
        'http-host',
        'mqtt-host',
        'tcp-host',
        'ws-port',
        'http-port',
        'mqtt-port',
        'tcp-port',
        'ws-url'
    ];

    var nodeIp = indexViewModel.curTreeNodeInfo.ip;
    var filterUri = 'filter_mac'
    if (compat.supports('gatt')) {
        filterUri = 'filter_ble'
        $("#conn-type option[value=1]").remove();
    }
    var filterApi = `http://${nodeIp}/${filterUri}`

    if (!compat.supports('tcp')) {
        $("#conn-type option[value=4]").remove();
    }

    function hideAll() {
        $("#cont-ws-client").hide();
        $("#cont-http-client").hide();
        $("#cont-mqtt-client").hide();
        $("#cont-tcp-client").hide();
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

    function loadFilter() {
        // replace with ble_filter instead
        $.get(filterApi, {s:new Date().getTime()}, function(filterData) {
            if (compat.supports('gatt')) {
                let filters = JSON.parse(filterData)
                if (typeof filters.mac != "undefined") {
                    $("#mac").val(filters.mac);
                }
                if (typeof filters.svc != "undefined") {
                    $("#services").val(filters.svc);
                }
                if (typeof filters.chr != "undefined") {
                    $("#chars").val(filters.chr);
                }

                $('.cont-services, .cont-chars').show()
                $('#services').tagsInput({
                    placeholder: 'Add a service UUID',
                    interactive: true,
                    delimiter: ['\n', ' '],
                    unique: true
                })

                $('#chars').tagsInput({
                    placeholder: 'Add a characteristics UUID',
                    delimiter: ['\n', ' '],
                    unique: true
                })
            } else {
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
            }

            $('#mac').tagsInput({
                placeholder: 'Add a mac',
                interactive: true,
                delimiter: ['\n', ' '],
                unique: true
            })

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

            case 4:
                hideAll();
                $("#cont-tcp-client").show();
            break;
        }
    });

    if (!compat.supports('hb-int')) {
        $('#cont-hb-int').hide()
    }

    if (compat.supports('phy')) {
        $('div.cont-long').show()
    }

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
        $("#cont-custom-filter").hide();
        $("#cont-mfg-filter").show();
        break;

        // iBeacon filter
        case 1:
        case 11:
        $("#cont-mfg-filter").hide();
        $("#cont-custom-filter").hide();
        $("#cont-uuid-filter").show();
        break;

        // custom filter
        case 5:
        $("#cont-mfg-filter").hide();
        $("#cont-custom-filter").show();
        $("#cont-uuid-filter").hide();
        break;

        default:
        $("#cont-uuid-filter").hide();
        $("#cont-custom-filter").hide();
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
        url: `http://${nodeIp}/config`
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

        if (typeof data['scan-window'] != 'undefined') {
            $("#cont-scan-window").removeClass('hidden')
        }

        if (typeof data['loop-save'] != 'undefined') {
            $("#cont-loop").removeClass('hidden')
        }

        for (var i = 0; i < configKeys.length; i++) {
            k = configKeys[i];
            $('#' + k).val(data[k]);
        }
        $('#ws-host').val(data['host']);
        $('#http-host').val(data['host']);
        $('#mqtt-host').val(data['host']);
        $('#tcp-host').val(data['host']);
        $('#ws-port').val(data['port']);
        $('#tcp-port').val(data['port']);
        $('#http-port').val(data['port']);
        $('#mqtt-port').val(data['port']);
        $('#ws-url').val(data['http-url']);

        $('#conn-type').change();
        $('#adv-filter').change();
        $('#mqtt-config').change();
        $('#req-format').change();
        $('#mqtt-id-prefix').trigger('input')
        $('#one-cfg-topic').trigger('input')

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

        setTimeout(loadFilter, 200);
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
        if (!compat.supports('metadata')) {
            $('#cont-metadata').hide()
            return
        }

        if ($(this).val() == 0) {
            $('#cont-metadata').hide()
        } else {
            $('#cont-metadata').show()
        }
    })

    $('#ws-port, #http-port, #mqtt-port, #tcp-port').change(function() {
        if ($(this).val() > 65535) {
            $(this).val(65535);
        } else if ($(this).val() < 80) {
            $(this).val(80);
        } else {
            $(this).val(parseInt($(this).val()));
        }
    });

    $('.toggle-label').click(function() {
        let icon = $('.icon-fold').html() == '▶' ? '▼' : '▶'
        $('.icon-fold').html(icon)
        $('div.cont-fold').toggle('fold', 0)
    })

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
                .done(data => alert("Changes have been saved."));
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

    $('#mqtt-id-prefix').on('input', function() {
        var mac = indexViewModel.curTreeNodeInfo.data.mac.replaceAll(':', '')
        var finalId = $(this).val() + mac
        if ($(this).val().endsWith('$$$')) {
            finalId = $(this).val().slice(0, -3)
        }
        $('#cont-final-id').text('ClientID=' + finalId)
    })

    $('#one-cfg-topic').on('input', function() {
        var mac = indexViewModel.curTreeNodeInfo.data.mac.replaceAll(':', '')
        $('#cont-one-topic').text($(this).val() + mac)
    })

    function cleanFilter(field, c) {
        let elt = `#${field}`
        let raw = $(elt).val()
        let regex = new RegExp(c, "g")
        let cont = raw.replace(regex, '').toUpperCase()
        $(elt).val(cont)
    }

    $("#f-filter-mac").attr('action', filterApi)
    $("#btn-save-mac").click(function() {
        cleanFilter('mac', ':')
        cleanFilter('services', '-')
        cleanFilter('chars', '-')

        $.ajax({
            type: "POST",
            url: filterApi,
            data: $("form#f-filter-mac").serialize(),
            success: function(data) {
                alert("Changes have been saved.")
            }
        });
    });
}

doneCallback();
