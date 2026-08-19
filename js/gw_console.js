(function() {
    let cliChars = "ab-cli"
    const { SerialPort } = require('serialport')
    const { ReadyParser } = require('@serialport/parser-ready')
    const STORAGE_KEY = "edit_form_wifi"

    function freePort() {
        if (typeof window.serialport == "undefined") {
            return
        }

        if (window.serialport.isOpen) {
            window.serialport.close()
        }

        delete window.serialport
    }

    function searchCli(port) {
        console.log("port", port)
        freePort()
        window.serialport = new SerialPort({ path: port.path, baudRate: 115200 })
        let p = window.serialport
        p.on('error', function(err) {
            alert(err)
        })
        const parser = p.pipe(new ReadyParser({ delimiter: 'ab-cli>' }))
        parser.on('ready', () => {
            console.log('The ready byte sequence has been received')
            $('.btn-conn-dev').hide()
            $("#console-bar").progressbar("destroy")
            $('.cont-console').show()
            $("#f-console-wifi :input").prop("disabled", false)
        })
        p.write("\n")
    }

    function loadDraft() {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        try {
            const data = JSON.parse(raw);
            $.each(data, function (name, val) {
                $('#f-console-wifi').find(`[name="${name}"]`).val(val);
            });
        } catch (e) {
            localStorage.removeItem(STORAGE_KEY);
        }
    }

    $('.btn-submit-wifi').click(function() {
        const formObj = {};
        $('#f-console-wifi').serializeArray().forEach(item => {
          formObj[item.name] = item.value;
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(formObj));

        let ssid = $('#serial-ssid').val()
        let pw = $('#serial-pw').val()
        let cmd = `connect ${ssid} ${pw}\n`
        //console.log("cmd", cmd)
        window.serialport.write(cmd)
        freePort()
        alert("Saved. Restarting the device..")
        $(this).attr('disabled', true)
        return false
    })

    $('.btn-conn-dev').click(function() {
        freePort()
        loadDraft()
        $(this).attr('disabled', true)
        $("#console-bar").progressbar({
            value: false
        });
        $("#console-bar")
            .progressbar("option", "value", false)
            .show()

        SerialPort.list().then(ports => {
            const filteredPorts = ports.filter(port => 
                typeof port.productId != "undefined" && 
                    port.productId.toLowerCase() === '1001' && 
                    port.vendorId.toLowerCase() === '303a'
            )

            if (filteredPorts.length > 0) {
                console.log("matched:", filteredPorts)
                searchCli(filteredPorts[0])
            } else {
                alert("No device connected")
            }
        })
    })

})()
