# Web Scraping
This project serves as a technical exam for Longshot Systems.

# Usage
Before starting, make sure to install the dependencies first:

```shell
composer install
```

Then you can simply run the application like so:

```shell
  php index.php challenge
```

The script will simply echo the message that we get from the web for simplicity's sake.

# Scraping Projects
## https://challenge.longshotsystems.co.uk/go
Scraping this page didn't prove to be straightforward. The trouble with the submission page comes from the fact that the payload, specifically `answer` that is required from the previous page is comprised of the user's answer, plus a string -- which is generated using the initial answer that you supplied in the input. Let's say you are presented with the following numbers:

```text
1 6 4 4 2 4 1 8
```

You will input the following:

```text
Answer: 16442418 
Name: test
```
After you hit the `Submit` button, you'll be redirected to a URL that looks like so:

```text
/submitgo?answer=164424188142446110094899d4d00e01d399864d1a0b91eca41&name=test
```

You'll notice that the answer is different from what we supplied in the input. We can break it down into four segments:

1. `16442418`: This is just the answer
2. `81424461`: while this one is the palindrome of the answer
3. `100`: This one has been generated using this formula:
    ```php
    $concat = intval("{$numbersAsInt}{$reversedNumbersAsInt}");
    
    (($concat % 5) + 99) * ($concat % 5)
    ```

    So here, a value of `16442418` will result in this formula:
    ```text
    ((1644241881424461 % 5) + 99) * (1644241881424461 % 5)
    ```
    and will be equal to `100`.
4. `94899d4d00e01d399864d1a0b91eca41`: This is the associated data attribute of the `.number-box` element of `n` index which is generated using this formula: 
    ```php
    $numbersAsInt % 8
    ```
    Here, `$numbersAsInt` is basically the number that we have in number one -- which is `16442418`

After the scraping is finished, you can confirm that the output message look like this:
```shell
The scraped output is [Well done, but you're not finished yet.]
```
