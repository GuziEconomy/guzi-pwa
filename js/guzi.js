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
    var ec = new elliptic.ec('secp256k1');
    // Generate keys
    var keypair = ec.genKeyPair();

    // Create the first block of the blockchain
    // 1. Birthday Block :
    let birthblock = {
        v: 1, // Version
        d: birthdate, // User birth date
        ph: "C1A551CA1C0DEEA5EFEA51B1E1DEA112ED1DEA0A5150F5E11AB1E50C1A15EED5", // Previous hash : here random
        s: keypair.getPublic(true, 'hex'), // Signer public key, here the new one created
        g: 0, b: 0, t: 0, // 0 guzis, 0 boxes, 0 total
    }
    
    hashblock(birthblock);

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
    // - make hashblock() method (or a makeBlock or somthing)
    // - save the blockchain
}

async function hashblock(block) {
    const packed = msgpack.encode(block);
    const digest = await crypto.subtle.digest('SHA-256', packed);

    console.log(packed);
    console.log(digest);
    console.log(await crypto.subtle.digest('SHA-256', msgpack.encode(msgpack.decode(packed))));
}

// TODO : use messagepack and create hashes
function makeTx(type, target, amount) {
    let tx = {v: 1, t: type, d: Date.now(), t: target, a: amount, h: null};
}

function updateContacts() {
    localforage.getItem('guzi-contacts').then(contacts => {
        html = "";
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
