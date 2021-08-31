document.addEventListener("DOMContentLoaded", (event) => {
    checkAccountIsValidOrCreateOne();
    updateContacts();
});

function checkAccountIsValidOrCreateOne() {
    return localforage.getItem('guzi-blockchain').then(blockchain => {
        if (blockchain === null) {
            var accountModal = new bootstrap.Modal(document.getElementById('newAccountModal'));
            accountModal.show();
        }
    });
}

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
    const birthblock = makeBirthBlock(birthdate, keypair.getPublic(true, 'hex'));
    
    signblock(birthblock, keypair);
    const cipherkey = CryptoJS.AES.encrypt(JSON.stringify(keypair), pwd).toString();
    const bytes  = CryptoJS.AES.decrypt(cipherkey, pwd);
    // const decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));

    localforage.setItem('guzi-cipherkey', [cipherkey]).then(() => {
        console.log(`Private key successfully saved`);
    }).catch(function(err) {
        console.err(`Error while saving Private key`);
    });

    localforage.setItem('guzi-blockchain', [birthblock]).then(() => {
        console.log(`Blockchain successfully saved`);
    }).catch(function(err) {
        console.err(`Error while saving Blockchain`);
    });

    $("#newAccountModal").modal("hide")

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
    // TODO : 
    // - Check password and confirmation are the same
    // - save the blockchain
}

export function makeBirthBlock(birthdate, publicHexKey) {
    return {
        v: 1, // Version
        d: birthdate, // User birth date
        ph: "c1a551ca1c0deea5efea51b1e1dea112ed1dea0a5150f5e11ab1e50c1a15eed5", // Previous hash : here "random"
        s: publicHexKey, // Compressed Signer public key, here the new one created
        g: 0, b: 0, t: 0, // 0 guzis, 0 boxes, 0 total
    }
}

export async function signblock(block, key) {
    const packedblock = msgpack.encode(block);
    const shaObj = new jsSHA("SHA-256", "UINT8ARRAY", { encoding: "UTF8" });
    shaObj.update(packedblock);
    const hash = shaObj.getHash("HEX");
    block.h = hash;
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
            <td>${contact.key}</td>
                </tr>`;
        });
        document.getElementById("contact-list").innerHTML = html;
    }).catch(function(err) {
        // This code runs if there were any errors
        console.log(err);
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
