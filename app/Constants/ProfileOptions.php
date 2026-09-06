<?php

namespace App\Constants;

class ProfileOptions
{
    public const GENDERS = [
        'male' => 'Male',
        'female' => 'Female',
    ];

    public const RELIGIONS = [
        'Islam' => 'Islam',
        'Christianity' => 'Christianity',
        'Hinduism' => 'Hinduism',
        'Sikhism' => 'Sikhism',
        'Buddhism' => 'Buddhism',
        'Jainism' => 'Jainism',
        'Other' => 'Other',
        'No religion' => 'No religion',
        'Prefer not to say' => 'Prefer not to say',
    ];

    public const SECTS = [
        'Sunni' => 'Sunni',
        'Shia' => 'Shia',
        'Ahle-Hadith' => 'Ahle-Hadith',
        'Other' => 'Other',
        'Prefer not to say' => 'Prefer not to say',
    ];

    public const CITIES = [
        'Karachi' => 'Karachi',
        'Lahore' => 'Lahore',
        'Islamabad' => 'Islamabad',
        'Rawalpindi' => 'Rawalpindi',
        'Faisalabad' => 'Faisalabad',
        'Multan' => 'Multan',
        'Peshawar' => 'Peshawar',
        'Quetta' => 'Quetta',
        'Hyderabad' => 'Hyderabad',
        'Gujranwala' => 'Gujranwala',
        'Sialkot' => 'Sialkot',
        'Bahawalpur' => 'Bahawalpur',
        'Sargodha' => 'Sargodha',
        'Abbottabad' => 'Abbottabad',
        'Sukkur' => 'Sukkur',
        'Other' => 'Other',
    ];

    public const EDUCATIONS = [
        'Matric / O-Level' => 'Matric / O-Level',
        'Intermediate / A-Level' => 'Intermediate / A-Level',
        'Diploma' => 'Diploma',
        "Bachelor's" => "Bachelor's",
        "Master's" => "Master's",
        'MPhil' => 'MPhil',
        'PhD' => 'PhD',
        'Other' => 'Other',
    ];

    public const EDUCATION_LEVELS = [
        'Matric / O-Level' => 10,
        'Intermediate / A-Level' => 20,
        'Diploma' => 25,
        "Bachelor's" => 30,
        "Master's" => 40,
        'MPhil' => 50,
        'PhD' => 60,
    ];

    /**
     * Get all education options that meet or exceed the specified minimum education level.
     *
     * @param string $minEducation
     * @return array<string>
     */
    public static function getEducationsAtOrAbove(string $minEducation): array
    {
        if (!isset(self::EDUCATION_LEVELS[$minEducation])) {
            return [$minEducation];
        }

        $minLevel = self::EDUCATION_LEVELS[$minEducation];
        $qualifying = [];

        foreach (self::EDUCATION_LEVELS as $education => $level) {
            if ($level >= $minLevel) {
                $qualifying[] = $education;
            }
        }

        return $qualifying;
    }

    public const PROFESSIONS = [
        'Student' => 'Student',
        'Software / IT' => 'Software / IT',
        'Engineering' => 'Engineering',
        'Medical / Healthcare' => 'Medical / Healthcare',
        'Education' => 'Education',
        'Business' => 'Business',
        'Finance / Banking' => 'Finance / Banking',
        'Government' => 'Government',
        'Law' => 'Law',
        'Marketing / Sales' => 'Marketing / Sales',
        'Freelance / Self-employed' => 'Freelance / Self-employed',
        'Skilled Professional' => 'Skilled Professional',
        'Homemaker' => 'Homemaker',
        'Retired' => 'Retired',
        'Other' => 'Other',
    ];

    public const MARITAL_STATUSES = [
        'never_married' => 'Never Married',
        'divorced' => 'Divorced',
        'widowed' => 'Widowed',
        'separated' => 'Separated',
    ];

    public const MANAGED_BY = [
        'myself' => 'Myself',
        'parent' => 'Parent',
        'sibling' => 'Brother / Sister',
        'guardian' => 'Guardian',
        'family' => 'Other Family Member',
    ];

    /**
     * Return all canonical options as an associative array.
     */
    public static function all(): array
    {
        return [
            'genders' => static::formatOptions(static::GENDERS),
            'religions' => static::formatOptions(static::RELIGIONS),
            'sects' => static::formatOptions(static::SECTS),
            'cities' => static::formatOptions(static::CITIES),
            'educations' => static::formatOptions(static::EDUCATIONS),
            'professions' => static::formatOptions(static::PROFESSIONS),
            'marital_statuses' => static::formatOptions(static::MARITAL_STATUSES),
            'managed_by' => static::formatOptions(static::MANAGED_BY),
        ];
    }

    private static function formatOptions(array $items): array
    {
        $result = [];
        foreach ($items as $value => $label) {
            $result[] = [
                'value' => (string) $value,
                'label' => $label,
            ];
        }
        return $result;
    }
}
