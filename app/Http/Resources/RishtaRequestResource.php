<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RishtaRequestResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $currentUserId = $request->user()?->id;
        $isSender = $currentUserId === $this->sender_id;

        // Candidate profile to display: if current user is sender, display receiver's profile;
        // if current user is receiver, display sender's profile.
        $targetUser = $isSender ? $this->receiver : $this->sender;
        $targetProfile = $targetUser?->profile;

        // Determine who must edit if revision is requested by admin
        $isResponseUnderRevision = $this->status === \App\Models\RishtaRequest::STATUS_ACCEPTED && empty($this->sender_answers);
        $isSenderAnswersUnderRevision = $this->status === \App\Models\RishtaRequest::STATUS_ACCEPTED && !empty($this->sender_answers);
        $isInitialProposalUnderRevision = $this->status === \App\Models\RishtaRequest::STATUS_PENDING;

        $needsRevisionTarget = null;
        if (($this->admin_status ?? null) === \App\Models\RishtaRequest::ADMIN_STATUS_NEEDS_REVISION) {
            if ($isInitialProposalUnderRevision || $isSenderAnswersUnderRevision) {
                $needsRevisionTarget = 'sender';
            } elseif ($isResponseUnderRevision) {
                $needsRevisionTarget = 'receiver';
            }
        }

        $canEditResponse = false;
        if ($needsRevisionTarget === 'sender' && $isSender) {
            $canEditResponse = true;
        } elseif ($needsRevisionTarget === 'receiver' && !$isSender) {
            $canEditResponse = true;
        }

        // Moderation privacy: ensure unapproved text/edits are not leaked to the counter-party before admin approval
        $adminStatus = $this->admin_status ?? \App\Models\RishtaRequest::ADMIN_STATUS_APPROVED;
        $isApproved = ($adminStatus === \App\Models\RishtaRequest::ADMIN_STATUS_APPROVED);

        // Receiver's response is pending moderation when status is accepted, sender hasn't replied yet, and admin hasn't approved the response
        $isReceiverResponsePendingModeration = ($this->status === \App\Models\RishtaRequest::STATUS_ACCEPTED && empty($this->sender_answers) && !$isApproved);

        // Sender's answers to counter-questions are pending moderation when sender has submitted answers and admin hasn't approved them
        $isSenderAnswersPendingModeration = ($this->status === \App\Models\RishtaRequest::STATUS_ACCEPTED && !empty($this->sender_answers) && !$isApproved);

        // Initial proposal is pending moderation when status is pending and admin hasn't approved it
        $isInitialProposalPendingModeration = ($this->status === \App\Models\RishtaRequest::STATUS_PENDING && !$isApproved);

        $hasReceiverResponse = !empty($this->receiver_intro) || !empty($this->receiver_answers) || !empty($this->receiver_questions);
        $hasSenderAnswers = !empty($this->sender_answers);

        // Safe field values
        $senderIntro = $this->sender_intro;
        $senderQuestions = $this->sender_questions;
        $receiverIntro = $this->receiver_intro;
        $receiverAnswers = $this->receiver_answers;
        $receiverQuestions = $this->receiver_questions;
        $senderAnswers = $this->sender_answers;

        $isAdmin = (bool) $request->user()?->isAdmin();

        if (!$isAdmin) {
            if ($isSender) {
                // If receiver's response has not been approved by admin, hide receiver's response from sender
                if ($isReceiverResponsePendingModeration) {
                    $receiverIntro = null;
                    $receiverAnswers = null;
                    $receiverQuestions = null;
                }
            } else {
                // Current user is receiver
                // If initial proposal is not yet approved, hide sender's intro and questions
                if ($isInitialProposalPendingModeration) {
                    $senderIntro = null;
                    $senderQuestions = null;
                }
                // If sender's answers to counter-questions are not yet approved, hide sender_answers from receiver
                if ($isSenderAnswersPendingModeration) {
                    $senderAnswers = null;
                }
            }
        }

        return [
            'id' => $this->id,
            'request_code' => $this->request_code,
            'direction' => $isSender ? 'sent' : 'received',
            'type' => $isSender ? 'sent' : 'received',
            'can_edit_response' => $canEditResponse,
            'needs_revision_target' => $needsRevisionTarget,
            'receiver_response_pending_moderation' => $isReceiverResponsePendingModeration,
            'sender_answers_pending_moderation' => $isSenderAnswersPendingModeration,
            'has_receiver_response' => $hasReceiverResponse,
            'has_sender_answers' => $hasSenderAnswers,
            'message' => $senderIntro ?: ($senderQuestions ?: null),
            'status' => $this->status,
            'admin_status' => $adminStatus,
            'sender_intro' => $senderIntro,
            'sender_questions' => $senderQuestions,
            'receiver_intro' => $receiverIntro,
            'receiver_answers' => $receiverAnswers,
            'receiver_questions' => $receiverQuestions,
            'sender_answers' => $senderAnswers,
            'photo_request_status' => $this->photo_request_status ?? 'none',
            'photo_requested_by_me' => ($isSender ? (bool) $this->sender_requested_photo : (bool) $this->receiver_requested_photo) || ($this->photo_requested_by === $currentUserId),
            'photo_requested_by_candidate' => ($isSender ? (bool) $this->receiver_requested_photo : (bool) $this->sender_requested_photo) || (!empty($this->photo_requested_by) && $this->photo_requested_by !== $currentUserId),
            'my_photo_shared' => $isSender ? !empty($this->sender_photo_path) : !empty($this->receiver_photo_path),
            'candidate_photo_shared' => $isSender ? !empty($this->receiver_photo_path) : !empty($this->sender_photo_path),
            'photo_moderation_status' => $isSender 
                ? ($this->receiver_photo_moderation_status !== 'none' ? $this->receiver_photo_moderation_status : ($this->photo_moderation_status ?? 'none'))
                : ($this->sender_photo_moderation_status !== 'none' ? $this->sender_photo_moderation_status : ($this->photo_moderation_status ?? 'none')),
            'my_photo_moderation_status' => $isSender
                ? ($this->sender_photo_moderation_status !== 'none' ? $this->sender_photo_moderation_status : ($this->photo_moderation_status ?? 'none'))
                : ($this->receiver_photo_moderation_status !== 'none' ? $this->receiver_photo_moderation_status : ($this->photo_moderation_status ?? 'none')),
            'photo_watermark_level' => $isSender
                ? ($this->receiver_photo_watermark_level ?: ($this->photo_watermark_level ?? 'medium'))
                : ($this->sender_photo_watermark_level ?: ($this->photo_watermark_level ?? 'medium')),
            'photo_watermark_text' => $isSender
                ? ($this->receiver_photo_watermark_text ?: $this->photo_watermark_text)
                : ($this->sender_photo_watermark_text ?: $this->photo_watermark_text),
            'photo_rejection_notes' => $isSender ? $this->receiver_photo_rejection_notes : $this->sender_photo_rejection_notes,
            'my_photo_rejection_notes' => $isSender ? $this->sender_photo_rejection_notes : $this->receiver_photo_rejection_notes,
            'photo_fee' => (float) ($this->photo_fee ?? 300.00),
            'photo_paid' => $isSender
                ? (bool) ($this->sender_photo_paid || ($this->photo_paid && $this->photo_paid_by === $currentUserId))
                : (bool) ($this->receiver_photo_paid || ($this->photo_paid && $this->photo_paid_by === $currentUserId)),
            'candidate_photo_paid' => $isSender
                ? (bool) ($this->receiver_photo_paid || ($this->photo_paid && $this->photo_paid_by !== $currentUserId))
                : (bool) ($this->sender_photo_paid || ($this->photo_paid && $this->photo_paid_by !== $currentUserId)),
            'photo_payment_pending' => $this->payments()->where('user_id', $currentUserId)->where('purpose', 'photo_unlock')->where('status', 'pending')->exists(),
            'can_view_candidate_photo' => ($isSender ? !empty($this->receiver_photo_path) : !empty($this->sender_photo_path)) 
                && (($isSender ? $this->receiver_photo_moderation_status : $this->sender_photo_moderation_status) === 'approved' || $this->photo_moderation_status === 'approved')
                && ($isSender ? (bool) ($this->sender_photo_paid || ($this->photo_paid && $this->photo_paid_by === $currentUserId)) : (bool) ($this->receiver_photo_paid || ($this->photo_paid && $this->photo_paid_by === $currentUserId))),
            'candidate_photo_url' => url("/api/requests/{$this->request_code}/view-photo"),
            'my_photo_url' => ($isSender ? !empty($this->sender_photo_path) : !empty($this->receiver_photo_path))
                ? url("/api/requests/{$this->request_code}/view-my-photo")
                : null,
            'nic_request_status' => $this->nic_request_status ?? 'none',
            'nic_requested_by_me' => $this->nic_requested_by === $currentUserId,
            'nic_requested_by_candidate' => !empty($this->nic_requested_by) && $this->nic_requested_by !== $currentUserId,
            'my_nic_shared' => $isSender ? (bool) $this->nic_shared_by_sender : (bool) $this->nic_shared_by_receiver,
            'candidate_nic_shared' => $isSender ? (bool) $this->nic_shared_by_receiver : (bool) $this->nic_shared_by_sender,
            'candidate_is_identity_verified' => $targetUser ? $targetUser->isIdentityVerified() : false,
            'i_am_identity_verified' => $request->user() ? $request->user()->isIdentityVerified() : false,
            'admin_notes' => $this->admin_notes,
            'is_sender' => $isSender,
            'is_admin_initiated' => !empty($this->initiated_by_admin_id),
            'candidate_profile' => $targetProfile ? new PublicProfileResource($targetProfile) : null,
            'created_at' => $this->created_at?->toIso8601String(),
            'expires_at' => $this->expires_at?->toIso8601String(),
            'accepted_at' => $this->accepted_at?->toIso8601String(),
            'declined_at' => $this->declined_at?->toIso8601String(),
            'cancelled_at' => $this->cancelled_at?->toIso8601String(),
        ];
    }
}
