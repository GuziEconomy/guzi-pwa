async function createAccountFromModal() {
    const birthdate = document.getElementById("new-account-modal-birthdate").value;
    const pwd = document.getElementById("new-account-modal-password").value;
    const pwd_conf = document.getElementById("new-account-modal-password-confirmation").value;
    if (pwd !== pwd_conf) {
        document.getElementById("pwd-error").className += "visible";
        return;
    }
    var ec = new elliptic.ec('secp256k1');
    // Generate keys
    var keypair = ec.genKeyPair();

    // Create the first block of the blockchain
    // 1. Birthday Block :
    let birthblock = makeBirthBlock(birthdate, keypair.getPublic(true, 'hex'));
    
    birthblock = await signblock(birthblock, keypair);
    const cipherkey = CryptoJS.AES.encrypt(JSON.stringify(keypair), pwd).toString();
    const bytes  = CryptoJS.AES.decrypt(cipherkey, pwd);
    // const decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));

    localforage.setItem('guzi-cipherkey', [cipherkey]).then(() => {
        console.log(`Private key successfully saved`);
    }).catch(function(err) {
        console.err(`Error while saving Private key`);
    });

    console.log(birthblock);
    localforage.setItem('guzi-blockchain', [birthblock]).then(() => {
        console.log(`Blockchain successfully saved`);
    }).catch(function(err) {
        console.error(`Error while saving Blockchain`);
        console.error(err);
    }).then(() => {
        updatePage();
        $("#newAccountModal").modal("hide")
    });


    //let initializationblock = {
    //    v: 1,
    //    d: Date.now(),
    //    ph: hashblock(birthblock),
    //    s: refPubKey,
    //    g: 1, b: 1, t: 0,
    //    tc: 2, tx: [
    //        {v: 1, t: 0, d: Date.now(), t: myPubKey, a: 1, h: null},
    //        {v: 1, t: 1, d: Date.now(), t: myPubKey, a: 1, h: null}
    //    ],
    //    ec: 0, en: []
    //}
}

function toHexString(byteArray) {
    return Array.from(byteArray, function(byte) {
        return ('0' + (byte & 0xFF).toString(16)).slice(-2);
    }).join('');
}

function exportBlockchain(bc) {
    return toHexString(msgpack.encode(bc));
}

function hexToBytes(hex) {
    for (var bytes = [], c = 0; c < hex.length; c += 2)
    bytes.push(parseInt(hex.substr(c, 2), 16));
    return bytes;
}

function hexToJson(hex) {
    const bytes = hexToBytes(hex);
    return msgpack.decode(bytes);
}

function sendBlockchain() {
    localforage.getItem('guzi-blockchain').then(blockchain => {
        if (blockchain === null) {
            showModalError("Aucune chaine de blocks détectée");
        } else {
            console.log(blockchain);
            const hexBc = exportBlockchain(blockchain);
            window.open(`mailto:test@example.com?subject=Demande de référent&body=${hexBc}`);
        }
    });
            
}

function makeBirthBlock(birthdate, publicHexKey) {
    return {
        v: 1, // Version
        d: birthdate, // User birth date
        ph: "c1a551ca1c0deea5efea51b1e1dea112ed1dea0a5150f5e11ab1e50c1a15eed5", // Previous hash : here "random"
        s: publicHexKey, // Compressed Signer public key, here the new one created
        g: 0, b: 0, t: 0, // 0 guzis, 0 boxes, 0 total
    }
}

function hashblock(block) {
    const b = {
        v: block.v,
        d: block.d,
        ph: block.ph,
        s: block.s,
        g: block.g,
        b: block.b,
        t: block.t,
    };
    const packedblock = msgpack.encode(b);
    const shaObj = new jsSHA("SHA-256", "UINT8ARRAY", { encoding: "UTF8" });
    shaObj.update(packedblock);
    return shaObj.getHash("HEX");
}

async function signblock(block, key) {
    const hash = hashblock(block);
    console.log(key.sign(hash));
    block.h = key.sign(hash).toDER('hex');
    return block;
}

// TODO : use messagepack and create hashes
function makeTx(type, target, amount) {
    let tx = {v: 1, t: type, d: Date.now(), t: target, a: amount, h: null};
}

function updateContacts() {
    localforage.getItem('guzi-contacts').then(contacts => {
        let html = "";
        if (contacts === null) { return }
        contacts.sort().forEach((contact) => {
            html += `<tr>
            <td>${contact.name}</td>
            <td>${contact.email}</td>
            <td class="text-truncate">${contact.key.substring(0, 10)}...</td>
                </tr>`;
        });
        document.getElementById("contact-list").innerHTML = html;
    }).catch(function(err) {
        // This code runs if there were any errors
        console.log(err);
    });
}

function updatePage() {
    localforage.getItem('guzi-blockchain').then(blockchain => {
        if (blockchain === null) {
            $("#guziInformationsButton").show();
            $("#newAccountButton").show();
            $("#sendAccountButton").hide();
            $("#createMyGuzisButton").prop("disabled", true);
            $("#importValidatedAccountButton").hide();
            $("#importPaymentButton").prop("disabled", true);
        } else if (blockchain.length === 1) {
            $("#guziInformationsButton").show();
            $("#newAccountButton").hide();
            $("#sendAccountButton").show();
            $("#createMyGuzisButton").prop("disabled", true);
            $("#importValidatedAccountButton").show();
            $("#importPaymentButton").prop("disabled", true);
        } else {
            // Not new user : hide account creation
            $("#guziInformationsButton").hide();
            $("#newAccountButton").hide();
            $("#sendAccountButton").hide();
            $("#createMyGuzisButton").prop("disabled", false);
            $("#importValidatedAccountButton").hide();
            $("#importPaymentButton").prop("disabled", false);
        }
    });
}

function addContactFromModal() {
    addContact(
        document.getElementById("new-contact-modal-name").value,
        document.getElementById("new-contact-modal-email").value,
        document.getElementById("new-contact-modal-key").value
    );
}

function addContact(name, email, key) {
    return localforage.getItem('guzi-contacts').then(contacts => {
        if (contacts === null) { contacts = [] }
        contacts.push({"name": name, "email": email, "key": key});
        localforage.setItem('guzi-contacts', contacts).then(() => {
            console.log(`${name} successfully saved`);
            updateContacts();
        }).catch(function(err) {
            console.err(`Error while saving ${name}`);
        });
    });
}

function importData(data, modal) {
    // TODO
    // - Detect if it's a block
    // - Detect if it's a blockchain
    // - if it's a payment
    // - or a validated account
    // - And act for it
    data = data.replace(/\s/g, '');
    jsondata = hexToJson(data);
    console.log(jsondata);
    if (! isValidBC(jsondata)) {
        showModalError("Les informations données sont invalides.");
        return false;
    }
    if (jsondata.length === 1) {
        console.log("It's an initialization");
        if (modal) {
            modal.modal("hide");
        }
        showModalAccountValidation(jsondata[0]);
        return true;
    }
    if (jsondata.length > 1) {
        console.log("It's a payment");
        return true;
    }
}

/**
 * Return true if given blockchain is valid, false else.
 */
function isValidBC(blockchain) {
    if (! Array.isArray(blockchain)) {
        return false;
    }
    if (blockchain.length === 0) {
        return false;
    }
    return true;
}

function isValidInitializationBlock(block) {
    const key = ec.keyFromPublic(block.s, 'hex');
    console.log(key);
    return block.ph === "c1a551ca1c0deea5efea51b1e1dea112ed1dea0a5150f5e11ab1e50c1a15eed5"
        && block.v === 1
        && block.g === 0
        && block.b === 0
        && block.t === 0
        && key.verify(hashblock(block), block.h);
}

function setBindings() {
    console.log("binding done");
    $("#import-data-pasted").bind('paste', function(e) {
        importData(e.originalEvent.clipboardData.getData('text'), $("#importModal"));
    });
}

function showModalImport() {
    $("#import-data-pasted").val("");
    $("#importModal").modal("show");
}

function showModalError(msg) {
    $("#modal-error-content").html(msg);
    $("#errorModal").modal("show");
}

function showModalAccountValidation(block) {

    let html = `
    <tr> <td>Version</td> <td>${block.v}</td></tr>
    <tr> <td>Birthdate</td> <td>${block.d}</td></tr>
    <tr> <td>Guzis</td> <td>${block.g}</td></tr>
    <tr> <td>Boxes</td> <td>${block.b}</td></tr>
    <tr> <td>Total</td> <td>${block.t}</td></tr>
    <tr> <td>Signataire</td> <td  class="overflow-auto">${block.s}</td></tr>
    <tr> <td>Hash de base</td> <td  class="overflow-auto">${block.ph}</td></tr>
    <tr> <td>Hash</td> <td class="overflow-auto">${block.h}</td></tr>`;
    $("#account-validation-detail").html(html);

    $("#accountValidationModal").modal("show");
}
