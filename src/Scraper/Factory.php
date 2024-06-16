<?php

namespace Dreadnaut\LongshotSystemsTechnicalExam\Scraper;

use Dreadnaut\LongshotSystemsTechnicalExam\Scraper\Support\Contracts\Scraper;

use function class_exists;
use function sprintf;
use function ucfirst;

class Factory
{
    /**
     * A {@see Scraper} object must be found in this namespace using
     * {@see Factory::$slug}
     *
     * @const String
     */
    const string NAMESPACE = 'Dreadnaut\LongshotSystemsTechnicalExam\Scraper\%s\Scraper';

    public function __construct(protected string $slug)
    {
    }

    /**
     * Looks for a {@see Scraper} object using the given slug, and returns a new
     * instance if found. Otherwise, returns null.
     *
     * @return Scraper|null
     */
    public function generate(): ?Scraper
    {
        $class = sprintf(self::NAMESPACE, ucfirst($this->slug));

        return class_exists($class) ? new $class:null;
    }
}
