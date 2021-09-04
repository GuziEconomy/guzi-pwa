# guzi-pwa
A Progressive Web App to use Guzi as payment system

I'm trying to make this app the as simple as possible, so I use the less frameworks I can.

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
4. [ ] Send an account creation request
5. [ ] Create a payment
6. [ ] Send a payment
7. [ ] Open and accept/reject account creation request
8. [ ] Open and accept/reject payment
