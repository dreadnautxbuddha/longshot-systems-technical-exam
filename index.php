<?php

use Dreadnaut\LongshotSystemsTechnicalExam\Scraper\Factory;

require 'vendor/autoload.php';

if (count($argv) !== 2) {
    throw new ArgumentCountError('The script should have exactly two arguments. index.php and the scraper slug');
}

[$scraper, $slug] = $argv;

$factory = new Factory($slug);
$scraper = $factory->generate();

if (is_null($scraper)) {
    throw new InvalidArgumentException("A scraper with slug [{$slug}] does not exist");
}

$output = "{$scraper->scrape()}";

if (empty($output)) {
    echo "Nothing was scraped. Sorry.\n";
} else {
    echo "The scraped output is [{$output}]\n";
}
