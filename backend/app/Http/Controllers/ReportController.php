<?php

namespace App\Http\Controllers;

use App\Models\Report;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ReportController extends Controller
{
    /**
     * Store a newly created report from a user.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'reportable_type' => ['required', Rule::in(['user', 'trip', 'review'])],
            'reportable_id'   => ['required', 'integer'],
            'reason'          => ['required', 'string', 'max:150'],
            'details'         => ['nullable', 'string', 'max:1000'],
        ]);

        // Prevent reporting self if reporting a user
        if ($validated['reportable_type'] === 'user' && (int)$validated['reportable_id'] === $request->user()->id) {
            return response()->json(['message' => 'You cannot report your own account.'], 422);
        }

        // Prevent duplicate pending report on the same entity
        $exists = Report::where('reporter_id', $request->user()->id)
            ->where('reportable_type', $validated['reportable_type'])
            ->where('reportable_id', $validated['reportable_id'])
            ->where('status', 'pending')
            ->exists();

        if ($exists) {
            return response()->json([
                'message' => 'You already have an open report pending review for this item.'
            ], 422);
        }

        $report = Report::create([
            'reporter_id'     => $request->user()->id,
            'reportable_type' => $validated['reportable_type'],
            'reportable_id'   => $validated['reportable_id'],
            'reason'          => $validated['reason'],
            'details'         => $validated['details'],
            'status'          => 'pending',
        ]);

        return response()->json([
            'message' => 'Report submitted successfully. Our safety moderation team will investigate.',
            'report'  => $report,
        ], 201);
    }

    /**
     * Admin: Fetch paginated reports list.
     */
    public function index(Request $request)
    {
        $reports = Report::with(['reporter:id,name,email', 'reportable'])
            ->when($request->filled('status'), fn($q) => $q->where('status', $request->status))
            ->latest()
            ->paginate(15);

        return response()->json($reports);
    }

    /**
     * Admin: Update report status and moderation notes.
     */
    public function updateStatus(Request $request, $id)
    {
        $validated = $request->validate([
            'status'      => ['required', Rule::in(['resolved', 'dismissed'])],
            'admin_notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $report = Report::findOrFail($id);
        $report->update($validated);

        return response()->json([
            'message' => "Report marked as {$validated['status']}.",
            'report'  => $report,
        ]);
    }
}