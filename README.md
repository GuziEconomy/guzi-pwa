# guzi-pwa
A Progressive Web App to use Guzi as payment system

I'm trying to make this app the as simple as possible, so I use the less frameworks I can.

## How it works

1. As a User, you need to create your Blockchain:
    1. Create an ECDSA Keypair
    2. Create the first block : the birthday block (containing your pubkey and birthdate)
2. Then you MUST send this one-block Blockchain to a referent user.
3. The referent must accept to add the initialization block to your blockchain:
    1. This block contains his pubkey and your first Guzis & GuziBoxes
    2. Then the block is added to your blockchain
    3. And the referent must send it back to you
4. Finally you receive the initialized Blockchain and your account is ready, you can now :
    1. Create your Guzis & GuziBoxes
    2. Send & receive payments

# Run tests

Unit tests belong on qunit, as it's simple and needs nothing else to run anywhere.
Run a simple server. I personaly use Python :

```
python -m SimpleHTTPServer 8000
```
or
```
python3 -m http.server
```

Then open 127.0.0.1/tests.html



# TODO
1. [X] Check pwd and confirmation are the same
2. [X] Save encoded private key with given password
3. [X] Save Blockchain localy
4. [X] Send an account creation request
5. [X] Create testable function for extend part of "loadBlockchain"
6. [X] Test it with no blockchain (should return 0)
7. [X] Change page update : everything should be hidden in the first place
8. [X] Test it all back to step 0
9. [X] Remove useless part (Guzis availables) for level 0 user
10. [X] Add 1/2 xp for account validation waiting
11. [X] Create my Guzis
12. [X] Create a payment
13. [X] Send a payment
15. [X] Open and accept
16. [X] Design, design, design !
17. [ ] Add wrong password handling in askPwdAndLoadPrivateKey function
18. [X] importData : handle block, blockchain or payment
19. [X] Test it all again
20. [X] Make a tab for contacts
21. [ ] Reject payment => send refusal back
22. [X] Bug in hasCreatedGuzisToday that always return false
23. [X] Focus in form when import clicked
