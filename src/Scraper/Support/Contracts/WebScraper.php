<?php

namespace Dreadnaut\LongshotSystemsTechnicalExam\Scraper\Support\Contracts;

use DOMDocument;
use GuzzleHttp\Client;
use GuzzleHttp\Cookie\SessionCookieJar;
use GuzzleHttp\Exception\GuzzleException;

/**
 * Represents a scraper whose source comes from the web.
 *
 * @package Dreadnaut\LongshotSystemsTechnicalExam\Scraper\Support\Contracts
 *
 * @author  Peter Cortez <innov.petercortez@gmail.com>
 */
abstract class WebScraper implements Scraper
{
    /**
     * The HTTP client that we'll be using for the web scraping requests.
     *
     * @var Client
     */
    protected Client $http;

    public function __construct()
    {
        $this->http = new Client([
            // Supplying a session cookie here ensures that subsequent requests
            // using this HTTP client instance will be read as coming from the
            // same web browser session.
            'cookies' => new SessionCookieJar('PHPSESSID', true),
        ]);
    }

    /**
     * Makes a request to the URI using the supplied options, and returns a
     * {@see DOMDocument} object from its response body.
     *
     * @see Client::get()
     *
     * @param       $uri
     * @param array $options
     *
     * @return DOMDocument
     */
    protected function getDOMDocument($uri, array $options = []): DOMDocument
    {
        $document = new DOMDocument();

        try {
            $request = $this->http->get($uri, $options);

            $document->loadHTML((string) $request->getBody());

            return $document;
        } catch (GuzzleException) {
        }

        return $document;
    }
}
