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

class MatrimonialProfilesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Common Pakistani first and last names
        $maleFirstNames = [
            'Muhammad', 'Ahmed', 'Ali', 'Usman', 'Hamza', 'Bilal', 'Zubair', 'Hassan',
            'Hussein', 'Omer', 'Tariq', 'Farhan', 'Saad', 'Zain', 'Daniyal', 'Kamran',
            'Shahzaib', 'Waqas', 'Asad', 'Khurram', 'Babar', 'Sarmad', 'Umair', 'Fahad',
            'Rehan', 'Haris', 'Junaid', 'Sufyan', 'Nabeel', 'Adeel', 'Moiz', 'Arsalan',
            'Mustafa', 'Abdullah', 'Shoaib', 'Shehroz', 'Talha', 'Imran', 'Irfan', 'Kashif'
        ];

        $femaleFirstNames = [
            'Fatima', 'Ayesha', 'Zainab', 'Maryam', 'Sana', 'Hira', 'Mahnoor', 'Anum',
            'Sidra', 'Iqra', 'Rabia', 'Komal', 'Alina', 'Mehak', 'Bushra', 'Amna',
            'Noor', 'Sara', 'Laiba', 'Areeba', 'Bisma', 'Kinza', 'Madiha', 'Sadia',
            'Rida', 'Nimra', 'Eman', 'Samreen', 'Farah', 'Sobia', 'Tehreem', 'Yumna',
            'Sahar', 'Hina', 'Nida', 'Zoya', 'Wardah', 'Aiman', 'Momina', 'Kiran'
        ];

        $lastNames = [
            'Khan', 'Ahmed', 'Ali', 'Malik', 'Chaudhry', 'Sheikh', 'Siddiqui', 'Qureshi',
            'Mughal', 'Ansari', 'Raza', 'Shah', 'Farooqi', 'Hashmi', 'Bhatti', 'Mirza',
            'Butt', 'Abbasi', 'Rehman', 'Hussain', 'Zafar', 'Baig', 'Dar', 'Javed'
        ];

        // Pakistani cities with weighted focus on Karachi (~50%), followed by Lahore, Islamabad, etc.
        $citiesWeighted = array_merge(
            array_fill(0, 55, 'Karachi'),
            array_fill(0, 22, 'Lahore'),
            array_fill(0, 15, 'Islamabad'),
            array_fill(0, 8, 'Rawalpindi'),
            array_fill(0, 6, 'Faisalabad'),
            array_fill(0, 5, 'Multan'),
            array_fill(0, 4, 'Peshawar'),
            array_fill(0, 4, 'Hyderabad'),
            array_fill(0, 3, 'Sialkot'),
            array_fill(0, 2, 'Gujranwala'),
            array_fill(0, 2, 'Quetta')
        );

        $managedByOptions = array_keys(ProfileOptions::MANAGED_BY);
        $totalToCreate = 125;
        $now = Carbon::now();

        $this->command->info("Seeding {$totalToCreate} realistic Pakistani candidate profiles...");

        for ($i = 1; $i <= $totalToCreate; $i++) {
            $isMale = ($i % 2 === 0);
            $gender = $isMale ? 'male' : 'female';
            $firstName = $isMale 
                ? $maleFirstNames[array_rand($maleFirstNames)] 
                : $femaleFirstNames[array_rand($femaleFirstNames)];
            $lastName = $lastNames[array_rand($lastNames)];
            $fullName = "{$firstName} {$lastName}";

            $age = rand(21, 38);
            $dob = Carbon::now()->subYears($age)->subDays(rand(1, 350))->format('Y-m-d');

            // Distinct, non-colliding dummy email reserved for platform seed demo profiles
            $emailSafeName = strtolower(preg_replace('/[^a-z0-9]/', '', $firstName . '.' . $lastName));
            $email = "dummy.{$emailSafeName}.{$i}@seed.raabtanow.com";

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
            $maritalStatus = rand(1, 10) <= 8 ? 'never_married' : (rand(1, 2) === 1 ? 'divorced' : 'widowed');

            // Heights: Males ~168-185, Females ~152-170
            $height = $isMale ? rand(168, 185) : rand(152, 170);

            $eduWeights = [
                "Bachelor's", "Bachelor's", "Bachelor's", "Master's", "Master's",
                'Intermediate / A-Level', 'MPhil', 'Diploma'
            ];
            $education = $eduWeights[array_rand($eduWeights)];

            $profWeights = [
                'Software / IT', 'Engineering', 'Medical / Healthcare', 'Business',
                'Finance / Banking', 'Education', 'Marketing / Sales', 'Skilled Professional'
            ];
            if (!$isMale && rand(1, 6) === 1) {
                $profession = 'Homemaker';
            } else {
                $profession = $profWeights[array_rand($profWeights)];
            }

            $managedBy = $managedByOptions[array_rand($managedByOptions)];

            $aboutStatements = [
                "Assalam-o-Alaikum. I am a simple, family-oriented person who values Islamic principles, honesty, and mutual respect. Looking for an understanding and sincere life partner.",
                "Warm regards. Focused on career and family balance. Looking for a compatible partner from a respectable family to build a peaceful future together.",
                "Seeking a pious, mature, and broad-minded companion for a lasting halal marital relationship based on trust and communication.",
                "Belongs to a decent and educated family. Looking for someone grounded in good cultural and Islamic family values.",
                "Ambitious yet humble. I enjoy reading, traveling, and spending time with family. Looking for a partner who believes in mutual growth and companionship."
            ];

            $familyStatements = [
                "We are a well-settled, educated family residing in {$city}. Father is retired and siblings are well-established.",
                "Belongs to an honorable, close-knit family with strong traditional and religious values. Moderate and practicing.",
                "Decent, cultured family background with deep roots in {$city}. Both parents value education and good morals.",
                "Respected family based in {$city}. We maintain a harmonious balance between Islamic values and modern education."
            ];

            $profile = Profile::create([
                'user_id' => $user->id,
                'profile_code' => Profile::generateUniqueProfileCode(),
                'gender' => $gender,
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

            $preferredGender = $isMale ? 'female' : 'male';
            $prefMinAge = max(18, $isMale ? $age - 6 : $age - 2);
            $prefMaxAge = $isMale ? $age + 2 : $age + 7;

            $possibleOtherCities = ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi'];
            $preferredCities = array_unique(array_merge([$city], [$possibleOtherCities[array_rand($possibleOtherCities)]]));

            ProfilePreference::create([
                'profile_id' => $profile->id,
                'preferred_gender' => $preferredGender,
                'min_age' => $prefMinAge,
                'max_age' => $prefMaxAge,
                'preferred_cities' => array_values($preferredCities),
                'preferred_religion' => 'Islam',
                'preferred_sect' => $sect,
                'min_height' => $isMale ? 150 : 165,
                'max_height' => $isMale ? 175 : 190,
                'preferred_education' => "Bachelor's",
                'preferred_marital_status' => ['never_married'],
            ]);

            // Badge Distribution:
            // ~35% Both ID and Education Verified
            // ~35% ID Verified only
            // ~30% No Verification Badges
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
                    'submitted_at' => $now->copy()->subDays(rand(5, 30)),
                    'reviewed_at' => $now->copy()->subDays(rand(1, 4)),
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
                    'submitted_at' => $now->copy()->subDays(rand(5, 30)),
                    'reviewed_at' => $now->copy()->subDays(rand(1, 4)),
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
                    'submitted_at' => $now->copy()->subDays(rand(5, 30)),
                    'reviewed_at' => $now->copy()->subDays(rand(1, 4)),
                    'reviewed_by' => null,
                    'documents_purged_at' => $now->copy()->subDays(1),
                ]);
            }
        }

        $this->command->info("Completed seeding {$totalToCreate} candidate profiles.");
    }
}
