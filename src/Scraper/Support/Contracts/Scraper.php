<?php

namespace Dreadnaut\LongshotSystemsTechnicalExam\Scraper\Support\Contracts;

interface Scraper
{
    /**
     * Returns an instance of the page that we're scraping.
     *
     * @return Page
     */
    public function scrape(): Page;
}
