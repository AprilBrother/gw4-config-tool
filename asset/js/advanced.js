function doneCallback() {
    let configUri = '/config';
    var zones = require('./asset/js/zones.json')
    var compat = require('./asset/js/compat')

    $('body').off('click', '#btn-restart');
    $("#btn-restart").click(function() {
        var data = {"restart": 1};
        $.post("http://"+indexViewModel.curTreeNodeInfo.ip+"/restart", data);
        alert("Restarted.");
    });

    var loadScheduleConfig = () => {
        getDeviceApi("/config", "json").done(data => {
            $('#tz').val(data['tz'])
            $('#sch-type').val(data['sch-type'])
            var schBegin = data['sch-begin'].split(':')
            $('#sch-begin-hour').val(schBegin[0])
            $('#sch-begin-min').val(schBegin[1])
            var schEnd = data['sch-end'].split(':')
            $('#sch-end-hour').val(schEnd[0])
            $('#sch-end-min').val(schEnd[1])
        })
    };

    if (compat.supports('schedule')) {
        Object.entries(zones).forEach(([key, value]) => {
            $('#tz').append(`<option value="${value}|${key}">${key}</option>`);
        })
        $('#cont-tz').show()
        loadScheduleConfig();
    } else {
        $('#cont-tz').hide()
    }

    $('#body').off('click', '.btn-sch');
    $("#btn-sch").click(() => {
        $('#sch-begin').val($('#sch-begin-hour').val() + ':' + $('#sch-begin-min').val())
        $('#sch-end').val($('#sch-end-hour').val() + ':' + $('#sch-end-min').val())
        postDeviceApi(configUri, $("form#f-schedule").serialize())
            .done(data => {
                console.log(data);
                alert("Schedule updated");
            });
    })

    $('#popupMsg').off('click', '.btn-branch');
    $('#popupMsg').on('click', '.btn-branch', () => {
        if ($('#sel-branch').val() == '1') {

            postDeviceApi(configUri, {"ota-url": "http://ota.bconimg.com/gw4-beta"})
                .done(data => {
                    console.log(data);
                    $("p.msg-branch").html("Selected testing branch");
                });
        } else {
            postDeviceApi(configUri, {"ota-url": "http://ota.bconimg.com/gw4"})
                .done(data => {
                    console.log(data);
                    $("p.msg-branch").html("Selected stable branch");
                });
        }
        
       $('.btn-branch') .prop("disabled", true);
        setTimeout(() => {
            $(".btn-branch").prop("disabled", false);
        }, 5000);
    });

    $('body').off('click', '#btn-testing');
    $("#btn-testing").click(() => {
        $("#popupMsg").html(`
            <p class="pure-form">
            <select id="sel-branch">
            <option value=0>Stable Branch</option>
            <option value="1">Testing Branch</option>
            </select> 
            <button class="pure-button pure-button-primary btn-branch">OK</button></p>
            <p class="msg-branch">Note: Don't select "Testing Branch" if you don't know what is it</p>
        `);
        $("#popupMsg").dialog({
            title: "Select Update Branch"
        });
    });

    $('#basic-auth').change(() => {
        if ($('#basic-auth').val() == '0') {
            $('#cont-auth').hide();
        } else {
            $('#cont-auth').show();
        }
    });

    $('body').off('click', '#btn-update');
    $("#btn-update").click(function() {
        $.post("http://"+indexViewModel.curTreeNodeInfo.ip+"/update", $("form#f-update").serialize())
            .done(function(data) {
                $("#popupMsg").html("<p>Updating firmware. Please wait a while...</p><div id=bar></div>");
                $("#popupMsg").dialog({
                    title: "Updating"
                });
                $("#bar").progressbar({
                  value: false
                });
                $("#bar").progressbar("option", "value", false);

                var timeId = window.setInterval(function() {
                    $.getJSON("http://" + indexViewModel.curTreeNodeInfo.ip + "/ota?t=" + (new Date().getTime()), function(data) {
                        if (data.status == 1) {
                            $("#bar").progressbar("option", "value", false);
                        } else {
                            $("#popupMsg").html("<p>Firmware is updated successful!</p>");
                            window.clearInterval(timeId);
                        }
                    });
                }, 3000);
            });
    });

    $("#f-update")[0].action="http://"+indexViewModel.curTreeNodeInfo.ip+"/update";

    $('body').off('click', '#btn-adv');
    $('#btn-adv').click(() => {
        postDeviceApi(configUri, $('form#f-adv').serialize())
            .done(data => {
                console.log(data);
            });
    });

    if (typeof indexViewModel.curTreeNodeInfo.data.auth != "undefined") {
        if (indexViewModel.curTreeNodeInfo.data.auth) {
            $('#basic-auth').val("1");
        } else {
            $('#basic-auth').val("0");
        }
        $('#basic-auth').change();
    } else {
        $('#cont-web-api').hide();
    }
}

if (window.jQuery) {
    doneCallback();
}

