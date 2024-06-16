<?php

namespace Dreadnaut\LongshotSystemsTechnicalExam\Scraper\Challenge;

use Dreadnaut\LongshotSystemsTechnicalExam\Scraper\Support;

use function trim;

class Page extends Support\Contracts\Page
{
    /**
     * @inheritDoc
     */
    public function __toString(): string
    {
        return trim($this->document->textContent);
    }
}
