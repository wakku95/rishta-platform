<?php

namespace Database\Factories;

use App\Models\AssistedListingInterest;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<AssistedListingInterest>
 */
class AssistedListingInterestFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'assisted_listing_id' => \App\Models\AssistedListing::factory(),
            'submitter_name' => $this->faker->name(),
            'submitter_contact' => '+923' . $this->faker->numerify('#########'),
            'submitter_email' => $this->faker->optional()->safeEmail(),
            'message' => $this->faker->optional()->sentence(),
            'status' => 'new',
        ];
    }
}
