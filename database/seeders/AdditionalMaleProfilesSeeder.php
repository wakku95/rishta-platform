<?php

namespace Database\Seeders;

use App\Constants\ProfileOptions;
use App\Models\Profile;
use App\Models\ProfilePreference;
use App\Models\ProfileVerification;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdditionalMaleProfilesSeeder extends Seeder
{
    /**
     * Run the database seeds for 15 additional male profiles.
     */
    public function run(): void
    {
        $maleFirstNames = [
            'Hamza', 'Bilal', 'Zubair', 'Hassan', 'Omer', 'Tariq', 'Farhan', 'Saad',
            'Zain', 'Daniyal', 'Kamran', 'Shahzaib', 'Waqas', 'Asad', 'Khurram',
            'Umair', 'Fahad', 'Rehan', 'Haris', 'Junaid', 'Mustafa', 'Abdullah'
        ];

        $lastNames = [
            'Khan', 'Ahmed', 'Ali', 'Malik', 'Chaudhry', 'Sheikh', 'Siddiqui', 'Qureshi',
            'Mughal', 'Ansari', 'Raza', 'Shah', 'Farooqi', 'Hashmi', 'Mirza', 'Butt'
        ];

        // Weighted with high focus on Karachi
        $citiesWeighted = array_merge(
            array_fill(0, 8, 'Karachi'),
            array_fill(0, 3, 'Lahore'),
            array_fill(0, 2, 'Islamabad'),
            array_fill(0, 1, 'Rawalpindi'),
            array_fill(0, 1, 'Faisalabad')
        );

        $managedByOptions = array_keys(ProfileOptions::MANAGED_BY);
        $totalToCreate = 15;
        $now = Carbon::now();

        $this->command->info("Adding {$totalToCreate} additional male candidate profiles...");

        for ($i = 1; $i <= $totalToCreate; $i++) {
            $firstName = $maleFirstNames[array_rand($maleFirstNames)];
            $lastName = $lastNames[array_rand($lastNames)];
            $fullName = "{$firstName} {$lastName}";

            $age = rand(24, 37);
            $dob = Carbon::now()->subYears($age)->subDays(rand(1, 350))->format('Y-m-d');

            $randomSuffix = rand(1000, 99999);
            $emailSafeName = strtolower(preg_replace('/[^a-z0-9]/', '', $firstName . '.' . $lastName));
            $email = "dummy.male.{$emailSafeName}.{$i}.{$randomSuffix}@seed.raabtanow.com";

            // Create verified active user
            $user = User::create([
                'name' => $fullName,
                'email' => $email,
                'password' => Hash::make('Password@123'),
                'email_verified_at' => $now->copy()->subDays(rand(2, 60)),
                'status' => 'active',
            ]);

            $city = $citiesWeighted[array_rand($citiesWeighted)];
            $sect = rand(1, 10) <= 8 ? 'Sunni' : (rand(1, 2) === 1 ? 'Shia' : 'Ahle-Hadith');
            $maritalStatus = rand(1, 10) <= 9 ? 'never_married' : 'divorced';
            $height = rand(170, 185);

            $eduWeights = ["Bachelor's", "Bachelor's", "Master's", "Master's", "MPhil"];
            $education = $eduWeights[array_rand($eduWeights)];

            $profWeights = [
                'Software / IT', 'Engineering', 'Business', 'Finance / Banking',
                'Marketing / Sales', 'Medical / Healthcare', 'Skilled Professional'
            ];
            $profession = $profWeights[array_rand($profWeights)];
            $managedBy = $managedByOptions[array_rand($managedByOptions)];

            $aboutStatements = [
                "Assalam-o-Alaikum. Well-settled and family-oriented professional residing in {$city}. Seeking a pious, respectful, and understanding life partner.",
                "Warm regards. Focused on career and family balance. Looking for a compatible partner from an educated family to build a happy and peaceful future.",
                "Practicing Muslim with good moral and family values. Looking for a sincere, caring companion for a blessed marital bond.",
                "Belongs to a decent and respected family. Looking for an educated partner who values both religious principles and cultural family traditions."
            ];

            $familyStatements = [
                "We are a well-settled, respectable family based in {$city}. Parents and siblings are educated and established.",
                "Belongs to an honorable, close-knit family with strong Islamic traditions and values.",
                "Decent, cultured family background with deep roots in {$city}. Both parents value good character and education."
            ];

            $profile = Profile::create([
                'user_id' => $user->id,
                'profile_code' => Profile::generateUniqueProfileCode(),
                'gender' => 'male',
                'date_of_birth' => $dob,
                'religion' => 'Islam',
                'sect' => $sect,
                'city' => $city,
                'education' => $education,
                'profession' => $profession,
                'marital_status' => $maritalStatus,
                'height' => $height,
                'about' => $aboutStatements[array_rand($aboutStatements)],
                'family_background' => $familyStatements[array_rand($familyStatements)],
                'managed_by' => $managedBy,
                'profile_status' => 'active',
            ]);

            $prefMinAge = max(18, $age - 6);
            $prefMaxAge = $age + 1;
            $possibleOtherCities = ['Karachi', 'Lahore', 'Islamabad'];
            $preferredCities = array_unique(array_merge([$city], [$possibleOtherCities[array_rand($possibleOtherCities)]]));

            ProfilePreference::create([
                'profile_id' => $profile->id,
                'preferred_gender' => 'female',
                'min_age' => $prefMinAge,
                'max_age' => $prefMaxAge,
                'preferred_cities' => array_values($preferredCities),
                'preferred_religion' => 'Islam',
                'preferred_sect' => $sect,
                'min_height' => 152,
                'max_height' => 172,
                'preferred_education' => "Bachelor's",
                'preferred_marital_status' => ['never_married'],
            ]);

            // Badge distribution:
            // ~35% Both, ~35% ID only, ~30% None
            $badgeRoll = $i % 10;

            if ($badgeRoll >= 0 && $badgeRoll <= 3) {
                // Both ID & Edu Verified
                ProfileVerification::create([
                    'user_id' => $user->id,
                    'type' => ProfileVerification::TYPE_IDENTITY,
                    'status' => ProfileVerification::STATUS_APPROVED,
                    'document_front_path' => null,
                    'document_back_path' => null,
                    'document_name' => 'CNIC Card',
                    'submitted_at' => $now->copy()->subDays(rand(5, 25)),
                    'reviewed_at' => $now->copy()->subDays(rand(1, 3)),
                    'reviewed_by' => null,
                    'documents_purged_at' => $now->copy()->subDays(1),
                ]);

                ProfileVerification::create([
                    'user_id' => $user->id,
                    'type' => ProfileVerification::TYPE_EDUCATION,
                    'status' => ProfileVerification::STATUS_APPROVED,
                    'document_front_path' => null,
                    'document_back_path' => null,
                    'document_name' => $education . ' Degree',
                    'submitted_at' => $now->copy()->subDays(rand(5, 25)),
                    'reviewed_at' => $now->copy()->subDays(rand(1, 3)),
                    'reviewed_by' => null,
                    'documents_purged_at' => $now->copy()->subDays(1),
                ]);
            } elseif ($badgeRoll >= 4 && $badgeRoll <= 7) {
                // Only ID Verified
                ProfileVerification::create([
                    'user_id' => $user->id,
                    'type' => ProfileVerification::TYPE_IDENTITY,
                    'status' => ProfileVerification::STATUS_APPROVED,
                    'document_front_path' => null,
                    'document_back_path' => null,
                    'document_name' => 'CNIC Card',
                    'submitted_at' => $now->copy()->subDays(rand(5, 25)),
                    'reviewed_at' => $now->copy()->subDays(rand(1, 3)),
                    'reviewed_by' => null,
                    'documents_purged_at' => $now->copy()->subDays(1),
                ]);
            }
        }

        $this->command->info("Successfully added {$totalToCreate} male candidate profiles.");
    }
}
