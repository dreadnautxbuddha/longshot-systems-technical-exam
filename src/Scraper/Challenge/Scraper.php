<?php

namespace Dreadnaut\LongshotSystemsTechnicalExam\Scraper\Challenge;

use DOMDocument;
use DOMXPath;
use Dreadnaut\LongshotSystemsTechnicalExam\Scraper\Support;
use GuzzleHttp\Client;
use GuzzleHttp\Cookie\SessionCookieJar;
use function implode;
use function intval;
use function sprintf;
use function trim;
use function var_dump;

class Scraper implements Support\Contracts\Scraper
{
    /**
     * @inheritDoc
     */
    public function scrape(): Page
    {
        $jar = new SessionCookieJar('PHPSESSID', true);
        $guzzle = new Client(['cookies' => $jar]);
        // 1. First, make a request to the /go page. This will show us the numbers
        // that we will submit later.
        $go = $guzzle->get('https://challenge.longshotsystems.co.uk/go');
        $document = new DOMDocument();
        $document->loadHTML((string) $go->getBody());
        $xpath = new DOMXPath($document);
        $numbers = [];
        $data = [];
        foreach ($xpath->query("//*[contains(@class, 'number-box')]") as $node)
        {
            $numbers[] = intval(trim($node->textContent));
            $data[] = $node->attributes->getNamedItem('data')->nodeValue;
        }
        $numbersAsInt = intval(implode('', $numbers));
        // 2. We now have the numbers. We can start building the answer. It is comprised
        // of the answer + a string that is generated from the numbers.
        $index = $numbersAsInt % 8;
        // $combined = $this->gen($numbersAsInt);
        $answer = sprintf('%s%s', $this->gen($numbersAsInt), $data[$index]);
        // var_dump($answer, $numbersAsInt, $this->gen($numbersAsInt), $data[$index]);
        // var_dump($answer, $numbersAsInt, $this->gen($numbersAsInt), $data[$index]);
        // die();
        // $answer = $this->gen($numbersAsInt);
        // var_dump($numbersAsInt, $index);
        // die();
        // $answer = implode('', $numbers);

        $submitGo = $guzzle->get("https://challenge.longshotsystems.co.uk/submitgo?answer={$answer}&name=test");
        // var_dump((string) $submitGo->getBody());
        // die();
        $submitGoDocument = new DOMDocument();
        $submitGoDocument->loadHTML((string) $submitGo->getBody());
        // var_dump($numbers);
        // die();
        // echo "<pre>";
        // print_r($numbers);
        // die();
        // Get the numbers first
        // then make another request to the submitgo endpoint like so:
        // https://challenge.longshotsystems.co.uk/submitgo?answer=1248733333378421100215581794490b86ba2222d0c297c3eb2&name=Peter%20Cortez

        return new Page($submitGoDocument);
    }

    private function gen(int $numbersAsInt): int
    {
        $reverse = strrev($numbersAsInt);
        $concat = intval("{$numbersAsInt}{$reverse}");

        return $concat . (($concat % 5) + 99) * ($concat % 5);
    }
}
