<?php

namespace Database\Factories;

use App\Models\AssistedListing;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<AssistedListing>
 */
class AssistedListingFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'listing_code' => 'AP-' . $this->faker->unique()->numberBetween(1001, 9999),
            'full_name' => $this->faker->name(),
            'gender' => $this->faker->randomElement(['male', 'female']),
            'date_of_birth' => $this->faker->dateTimeBetween('-40 years', '-20 years')->format('Y-m-d'),
            'religion' => 'Islam',
            'sect' => $this->faker->randomElement(['Sunni', 'Shia', 'Just Muslim', 'Other']),
            'city' => $this->faker->randomElement(['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi']),
            'education' => $this->faker->randomElement(['Bachelors', 'Masters', 'PhD', 'High School']),
            'profession' => $this->faker->jobTitle(),
            'marital_status' => $this->faker->randomElement(['never_married', 'divorced', 'widowed', 'separated']),
            'height' => $this->faker->numberBetween(150, 190), // in cm
            'public_about' => $this->faker->paragraph(),
            'family_background' => $this->faker->paragraph(),
            'managed_by' => 'family',
            'listing_status' => 'published',
            'consent_given_at' => now(),
            'contact_number' => '+923' . $this->faker->numerify('#########'),
        ];
    }
}
