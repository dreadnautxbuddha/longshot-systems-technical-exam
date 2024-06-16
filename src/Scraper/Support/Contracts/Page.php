<?php

namespace Dreadnaut\LongshotSystemsTechnicalExam\Scraper\Support\Contracts;

use DOMDocument;

/**
 * Represents a web page that we are scraping.
 *
 * @package Dreadnaut\LongshotSystemsTechnicalExam\Scraper\Support\Contracts
 *
 * @author  Peter Cortez <innov.petercortez@gmail.com>
 */
abstract class Page
{
    /**
     * Returns a string-representation of the page that we're looking at.
     *
     * @return string
     */
    abstract public function __toString(): string;

    public function __construct(protected DOMDocument $document)
    {
    }
}
