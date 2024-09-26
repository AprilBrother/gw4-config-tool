(function() {
    let cliChars = "ab-cli"
    const { SerialPort } = require('serialport')
    const { ReadyParser } = require('@serialport/parser-ready')

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
        const parser = p.pipe(new ReadyParser({ delimiter: 'ab-cli>' }))
        p.write("\n")
        parser.on('ready', () => {
            console.log('the ready byte sequence has been received')
            $('.btn-conn-dev').hide()
            $('.cont-console').show()
        })
    }

    $('.btn-submit-wifi').click(function() {
        let ssid = $('#serial-ssid').val()
        let pw = $('#serial-pw').val()
        let cmd = `connect ${ssid} ${pw}\n`
        console.log("cmd", cmd)
        window.serialport.write(cmd)
        freePort()
        return false
    })

    $('.btn-conn-dev').click(function() {
        SerialPort.list().then(ports => {
            const filteredPorts = ports.filter(port => 
                port.productId === '1001' && port.vendorId === '303a'
            )

            if (filteredPorts.length > 0) {
                console.log("matched:", filteredPorts)
                searchCli(filteredPorts[0])
            }
        })
    })

})()
