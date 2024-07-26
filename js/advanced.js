function doneCallback() {
    const META_LEN = 9
    const OFFSET_RSSI = 7

    const {ipcRenderer} = require('electron');

    let fetch = require('node-fetch')
    let fs = require('fs')
    let slip = require('slip')

    let configUri = '/config';
    let nodeIp = indexViewModel.curTreeNodeInfo.ip
    var zones = require('./js/zones.json')
    var compat = require('./js/compat')

    $('body').off('click', '#btn-restart');
    $("#btn-restart").click(function() {
        var data = {"restart": 1};
        $.post(`http://${nodeIp}/restart`, data);
        alert("Restarted.");
    });

    function uint8to32(arr) {
        if (arr.length !== 4) {
            throw new Error('Input array must have exactly 4 elements');
        }

        return (arr[3] << 24) | (arr[2] << 16) | (arr[1] << 8) | arr[0];
    }

    function uint8tohex(arr) {
        return Array.from(arr, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    function parseLog() {
        let filePath = 'log.txt'
        let outPath = 'log.csv'
        let mid, ts;

        console.log("File downloaded", filePath)
        function logMessage(msg) {
            // Meta frame
            if (msg.length == META_LEN) {
                mid = uint8to32(msg.slice(1, 5))
                ts = uint8to32(msg.slice(5))
                return
            }

            let arr = []
            arr.push(mid)
            arr.push(ts)
            let type = msg[0]
            let mac = uint8tohex(msg.slice(1,7))
            let rssi = msg[OFFSET_RSSI] - 256
            let adv = uint8tohex(msg.slice(OFFSET_RSSI + 1))

            arr.push(type)
            arr.push(mac)
            arr.push(rssi)
            arr.push(adv)
            //console.log(arr)

            fs.appendFileSync(outPath, arr.join(',') + '\n')
        }

        try {
            let thead = "ID,Time,AdvertingType,Mac,RSSI,AdvertisingData\n"
            fs.writeFileSync(outPath, thead)
            let data = fs.readFileSync(filePath)
            console.log('len:', data.length, typeof data)
            var decoder = new slip.Decoder({
                onMessage: logMessage,
                bufferSize: 2048
            })
            decoder.decode(data)
            ipcRenderer.send("showDownload")
        } catch (e) {
            console.error(e)
        }
    }

    $("#btn-down").click(function() {
        console.log('down')
        parseLog()
        return
        //TODO: add purge
        try {
            let filePath = 'log.txt'
            //let response = await fetch(`http://${nodeIp}/log?purge=1`)
            fetch(`http://${nodeIp}/log`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error ${response.status}`)
                    }

                    let writer = fs.createWriteStream(filePath)
                    response.body.pipe(writer);
                    
                    writer.on('finish', parseLog)

                    writer.on('error', function() {
                        console.log("File download fail")
                    })
                })
        } catch(e) {
            console.log('Error downloading:', e)
        }

    })

    $("#btn-cleanup").click(function() {
        console.log('cleanup')
    })

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

        if ($('#sch-end').val() <= $('#sch-begin').val()) {
            alert("End time must be greater than begin time");
            return false;
        }

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
                alert('Form submitted successfully.')
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

