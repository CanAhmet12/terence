<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\ParentStudent;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ParentStudentRelationTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test parent can add a child
     */
    public function test_parent_can_add_child(): void
    {
        $parent = User::factory()->create(['role' => 'parent']);
        $student = User::factory()->create(['role' => 'student']);

        $parent->addChild($student->id, 'father');

        $this->assertTrue($parent->hasChild($student->id));
        $this->assertEquals(1, $parent->children()->count());
        $this->assertEquals('father', $parent->children->first()->pivot->relation);
        $this->assertEquals('approved', $parent->children->first()->pivot->status);
    }

    /**
     * Test parent can add child with invite code (pending status)
     */
    public function test_parent_can_add_child_with_invite_code(): void
    {
        $parent = User::factory()->create(['role' => 'parent']);
        $student = User::factory()->create(['role' => 'student']);

        $inviteCode = ParentStudent::generateInviteCode();
        $parent->addChild($student->id, 'mother', $inviteCode);

        $this->assertTrue($parent->hasChild($student->id));
        $child = $parent->children->first();
        $this->assertEquals('pending', $child->pivot->status);
        $this->assertEquals($inviteCode, $child->pivot->invite_code);
    }

    /**
     * Test non-parent cannot add child
     */
    public function test_non_parent_cannot_add_child(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Only parent role can add children');

        $teacher = User::factory()->create(['role' => 'teacher']);
        $student = User::factory()->create(['role' => 'student']);

        $teacher->addChild($student->id);
    }

    /**
     * Test cannot add same child twice
     */
    public function test_cannot_add_same_child_twice(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Child already linked to this parent');

        $parent = User::factory()->create(['role' => 'parent']);
        $student = User::factory()->create(['role' => 'student']);

        $parent->addChild($student->id);
        $parent->addChild($student->id); // Should throw exception
    }

    /**
     * Test parent can remove child
     */
    public function test_parent_can_remove_child(): void
    {
        $parent = User::factory()->create(['role' => 'parent']);
        $student = User::factory()->create(['role' => 'student']);

        $parent->addChild($student->id);
        $this->assertTrue($parent->hasChild($student->id));

        $parent->removeChild($student->id);
        $this->assertFalse($parent->hasChild($student->id));
        $this->assertEquals(0, $parent->children()->count());
    }

    /**
     * Test student can see their parents
     */
    public function test_student_can_see_their_parents(): void
    {
        $parent1 = User::factory()->create(['role' => 'parent', 'name' => 'Mother']);
        $parent2 = User::factory()->create(['role' => 'parent', 'name' => 'Father']);
        $student = User::factory()->create(['role' => 'student']);

        $parent1->addChild($student->id, 'mother');
        $parent2->addChild($student->id, 'father');

        $this->assertEquals(2, $student->parents()->count());
        $this->assertTrue($student->hasParent($parent1->id));
        $this->assertTrue($student->hasParent($parent2->id));
    }

    /**
     * Test parent can approve pending child
     */
    public function test_parent_can_approve_pending_child(): void
    {
        $parent = User::factory()->create(['role' => 'parent']);
        $student = User::factory()->create(['role' => 'student']);

        $inviteCode = ParentStudent::generateInviteCode();
        $parent->addChild($student->id, 'parent', $inviteCode);

        $child = $parent->children->first();
        $this->assertEquals('pending', $child->pivot->status);

        $parent->approveChild($student->id);
        $parent->refresh();

        $child = $parent->children->first();
        $this->assertEquals('approved', $child->pivot->status);
    }

    /**
     * Test parent can reject pending child
     */
    public function test_parent_can_reject_pending_child(): void
    {
        $parent = User::factory()->create(['role' => 'parent']);
        $student = User::factory()->create(['role' => 'student']);

        $inviteCode = ParentStudent::generateInviteCode();
        $parent->addChild($student->id, 'parent', $inviteCode);

        $parent->rejectChild($student->id);
        $parent->refresh();

        $child = $parent->children->first();
        $this->assertEquals('rejected', $child->pivot->status);
    }

    /**
     * Test parent can get only approved children
     */
    public function test_parent_can_get_only_approved_children(): void
    {
        $parent = User::factory()->create(['role' => 'parent']);
        $student1 = User::factory()->create(['role' => 'student']);
        $student2 = User::factory()->create(['role' => 'student']);
        $student3 = User::factory()->create(['role' => 'student']);

        $parent->addChild($student1->id); // approved by default
        $parent->addChild($student2->id, 'parent', 'CODE123'); // pending
        $parent->addChild($student3->id); // approved by default

        $this->assertEquals(3, $parent->children()->count());
        $this->assertEquals(2, $parent->approvedChildren()->count());
        $this->assertEquals(1, $parent->pendingChildren()->count());
    }

    /**
     * Test ParentStudent pivot model methods
     */
    public function test_parent_student_pivot_model_methods(): void
    {
        $parent = User::factory()->create(['role' => 'parent']);
        $student = User::factory()->create(['role' => 'student']);

        $inviteCode = ParentStudent::generateInviteCode();
        $parent->addChild($student->id, 'parent', $inviteCode);

        $pivot = ParentStudent::where('parent_id', $parent->id)
            ->where('student_id', $student->id)
            ->first();

        $this->assertNotNull($pivot);
        $this->assertTrue($pivot->isPending());
        $this->assertFalse($pivot->isApproved());
        $this->assertFalse($pivot->isRejected());

        $pivot->approve();
        $pivot->refresh();

        $this->assertTrue($pivot->isApproved());
        $this->assertFalse($pivot->isPending());
    }

    /**
     * Test invite code generation is unique
     */
    public function test_invite_code_generation_is_unique(): void
    {
        $codes = [];

        for ($i = 0; $i < 10; $i++) {
            $code = ParentStudent::generateInviteCode();
            $this->assertNotContains($code, $codes);
            $codes[] = $code;
        }

        // All codes should be unique
        $this->assertEquals(10, count(array_unique($codes)));
    }

    /**
     * Test isParent helper method
     */
    public function test_is_parent_helper_method(): void
    {
        $parent = User::factory()->create(['role' => 'parent']);
        $student = User::factory()->create(['role' => 'student']);
        $teacher = User::factory()->create(['role' => 'teacher']);
        $admin = User::factory()->create(['role' => 'admin']);

        $this->assertTrue($parent->isParent());
        $this->assertFalse($student->isParent());
        $this->assertFalse($teacher->isParent());
        $this->assertFalse($admin->isParent());
    }
}
