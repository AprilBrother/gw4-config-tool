var configKeys = [
    'req-int', 
    'http-url', 
    'mqtt-username', 
    'mqtt-password', 
    'mqtt-topic',
    'mqtt-id-prefix',
    'min-rssi', 
    'data-format', 
    'conn-type', 
    'dup-filter', 
    'adv-filter',
    'scan-act',
    'filter-uuid',
    'boot-period' 
], formKeys = [ 
    'ws-host',
    'http-host',
    'mqtt-host',
    'ws-port',
    'http-port',
    'mqtt-port',
    'ws-url'
];

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
    $("#popupMsg").dialog();
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

$('#adv-filter').change(() => {
    switch(parseInt($('#adv-filter').val())) {
        case 1:
            $("#cont-uuid-filter").show();
        break;

        default:
            $("#cont-uuid-filter").hide();
        break;
    }
});

$.getJSON("http://"+indexViewModel.curTreeNodeInfo.ip+"/config.json", {s:new Date().getTime()}, function(data) {
    var k;
    if (!data['http-url'].length) {
        data['http-url'] = '/';
    }

    if (typeof data['boot-period'] == 'undefined') {
        $("#cont-auto-restart").hide();
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
        $.get("http://"+indexViewModel.curTreeNodeInfo.ip+"/filter_mac", {s:new Date().getTime()}, function(filterData)
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
    if ($(this).val() > 10) {
        $(this).val(10);
    } else if ($(this).val() < 1) {
        $(this).val(1);
    } else {
        $(this).val(parseInt($(this).val()));
    }
});

$('#ws-port, #http-port, #mqtt-port').change(function() {
    if ($(this).val() > 65535) {
        $(this).val(65535);
    } else if ($(this).val() < 80) {
        $(this).val(80);
    } else {
        $(this).val(parseInt($(this).val()));
    }
});

$("#f-app")[0].action="http://"+indexViewModel.curTreeNodeInfo.ip+"/config";
$("#btn-save-app").click(function() {
    var connType = $('#conn-type').val();
    switch(connType) {
        case "1":
            if (!$('#ws-url').val().length) {
                alert("URI cannot be empty");
                return;
            }
            break;

        case "2":
            if (!$('#http-url').val().length) {
                alert("URI cannot be empty");
                return;
            }
            break;

        default:
            break;
    }

    $.ajax({
        type: "POST",
        url: "http://"+indexViewModel.curTreeNodeInfo.ip+"/config",
        data: $("form#f-app").serialize(),
        success: function(data) {
            $("#saveWifiMsg").dialog();
        }
    });
});


$("#f-filter-mac")[0].action="http://"+indexViewModel.curTreeNodeInfo.ip+"/filter_mac";
$("#btn-save-mac").click(function() {
    $.ajax({
        type: "POST",
        url: "http://"+indexViewModel.curTreeNodeInfo.ip+"/filter_mac",
        data: $("form#f-filter-mac").serialize(),
        success: function(data) {
            $("#saveWifiMsg").dialog();
        }
    });
});
