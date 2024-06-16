<?php

namespace Dreadnaut\LongshotSystemsTechnicalExam\Scraper\Challenge;

use DOMDocument;
use DOMXPath;
use Dreadnaut\LongshotSystemsTechnicalExam\Scraper\Support;

use function implode;
use function intval;
use function sprintf;
use function strrev;
use function trim;

/**
 * Scrapes the page that comes after the form at https://challenge.longshotsystems.co.uk/go is submitted.
 *
 * The trouble with the submission page comes from the fact that the payload, specifically  `answer` that is required
 * from the previous page is comprised of the user's answer, plus a string -- which is generated using the initial
 * answer that you supplied in the input.
 *
 * Let's say you are presented with the following numbers:
 * <code>
 *     1 6 4 4 2 4 1 8
 * </code>
 *
 * You will input the following:
 *
 * <code>
 *     Answer: 16442418
 *     Name: test
 * </code>
 *
 * After you hit the `Submit` button, you'll be redirected to a URL that looks like so:
 * <code>
 *     /submitgo?answer=164424188142446110094899d4d00e01d399864d1a0b91eca41&name=test
 * </code>
 *
 * You'll notice that the answer is different from what we supplied in the input. We can break it down into four
 * segments:
 * 1. `16442418`: This is just the answer
 * 2. `81424461`: while this one is the palindrome of the answer
 * 2. `100`: This one has been generated using a specific formula. Refer to {@see Scraper::generateSessionId}
 * 3. `94899d4d00e01d399864d1a0b91eca41`: This is the associated `data` attribute of the `.number-box` element of `n`
 *      index which is generated using this formula: `$numbersAsInt % 8`. Here, `$numbersAsInt` is basically the number
 *      that we have in number one -- which is `16442418`
 *
 * @package Dreadnaut\LongshotSystemsTechnicalExam\Scraper\Challenge
 *
 * @author  Peter Cortez <innov.petercortez@gmail.com>
 */
class Scraper extends Support\Contracts\WebScraper
{
    /**
     * @inheritDoc
     */
    public function scrape(): Page
    {
        $numbers = [];
        $data = [];
        foreach (
            $this->getNumberNodes($this->getDOMDocument('https://challenge.longshotsystems.co.uk/go')) as [
                $number,
                $datum
            ]
        ) {
            $numbers[] = $number;
            $data[] = $datum;
        }
        $numbersAsInt = intval(implode('', $numbers));
        $index = $numbersAsInt % 8;
        $answer = $this->getAnswer($numbersAsInt, $data[$index]);

        return new Page(
            // From what we've seen, the `name` query parameter doesn't really have a "correct" value so we're just
            // giving it a value of `test`
            $this->getDOMDocument("https://challenge.longshotsystems.co.uk/submitgo?answer={$answer}&name=test")
        );
    }

    /**
     * Looks for all elements within the document that has a class of `number-box` and returns an array with the first
     * element containing the number, and the second containing its `data` attribute's value.
     *
     * @param DOMDocument $document
     *
     * @return iterable
     */
    private function getNumberNodes(DOMDocument $document): iterable
    {
        $xpath = new DOMXPath($document);

        foreach ($xpath->query("//*[contains(@class, 'number-box')]") as $node) {
            yield [intval(trim($node->textContent)), $node->attributes->getNamedItem('data')->nodeValue];
        }
    }

    /**
     * Generates an answer from the supplied number and UUID
     *
     * @param int    $numbers
     * @param string $uuid
     *
     * @return string
     */
    private function getAnswer(int $numbers, string $uuid): string
    {
        return sprintf('%s%s%s%s', $numbers, strrev($numbers), $this->generateSessionId($numbers), $uuid);
    }

    /**
     * From the answers, a session ID is generated using the reverse of the supplied numbers concatenated with a number
     * using this formula:
     * <code>
     *     $concat = intval("{$numbersAsInt}{$reversedNumbersAsInt}");
     *
     *     (($concat % 5) + 99) * ($concat % 5)
     * </code>
     *
     * So here, a value of `16442418` will result in this formula:
     * <code>
     *     ((1644241881424461 % 5) + 99) * (1644241881424461 % 5)
     * </code>
     * and will be equal to `100`
     *
     * @param int $numbersAsInt
     *
     * @return int
     */
    private function generateSessionId(int $numbersAsInt): int
    {
        $concat = sprintf('%d%d', $numbersAsInt, strrev($numbersAsInt));

        return (($concat % 5) + 99) * ($concat % 5);
    }
}
