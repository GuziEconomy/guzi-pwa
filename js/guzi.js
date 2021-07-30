document.addEventListener("DOMContentLoaded", (event) => {
    updateContacts();
});

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
