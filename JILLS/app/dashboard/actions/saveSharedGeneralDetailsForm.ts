"use server"

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"

export async function saveSharedGeneralDetailsForm(formData: any) {
  try {
    const supabase = await createClient()

    // Get the authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("Authentication error:", authError)
      return { success: false, error: "User not authenticated" }
    }

    // Find the user record in the users table
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, name, email")
      .eq("auth_id", user.id)
      .single()

    if (userError || !userData) {
      console.error("Error finding user:", userError)
      return { success: false, error: "User not found in database" }
    }

    const faculty_id = userData.id

    // Get all faculty teaching this subject
    const { data: allFaculty, error: facultyError } = await supabase
      .from("user_role")
      .select("user_id")
      .eq("subject_id", formData.subject_id)
      .eq("role_name", "Faculty")

    if (facultyError) {
      console.error("Error fetching faculty:", facultyError)
      return { success: false, error: "Failed to fetch faculty list" }
    }

    console.log("👥 All faculty for subject:", allFaculty)

    // Prepare the form data
    const term_start_date =
      formData.term_start_date instanceof Date ? formData.term_start_date : new Date(formData.term_start_date)

    const term_end_date =
      formData.term_end_date instanceof Date ? formData.term_end_date : new Date(formData.term_end_date)

    const formDataToSave = {
      generalDetails: {
        division: formData.division,
        lecture_hours: formData.lecture_hours,
        lab_hours: formData.lab_hours,
        credits: formData.credits,
        term_start_date: term_start_date,
        term_end_date: term_end_date,
        course_prerequisites: formData.course_prerequisites,
        course_prerequisites_materials: formData.course_prerequisites_materials,
        courseOutcomes: formData.courseOutcomes,
        remarks: formData.remarks || "",
        last_updated_by: faculty_id,
        last_updated_at: new Date().toISOString(),
      },
    }

    // Check if any form exists for this subject (from any faculty)
    const { data: existingForms, error: fetchError } = await supabase
      .from("forms")
      .select("id, form, faculty_id")
      .eq("subject_id", formData.subject_id)
      .limit(1)

    let result

    if (existingForms && existingForms.length > 0) {
      console.log("📝 Updating existing shared form...")

      // Update the existing form with new data
      const existingFormData = existingForms[0].form || {}
      const updatedFormData = {
        ...existingFormData,
        generalDetails: formDataToSave.generalDetails,
      }

      // Update the existing form
      result = await supabase
        .from("forms")
        .update({
          form: updatedFormData,
          faculty_id: faculty_id, // Update to current faculty as last editor
        })
        .eq("id", existingForms[0].id)

      // Create/update forms for all other faculty teaching this subject
      for (const facultyRole of allFaculty) {
        if (facultyRole.user_id !== existingForms[0].faculty_id) {
          // Check if this faculty already has a form
          const { data: facultyForm } = await supabase
            .from("forms")
            .select("id")
            .eq("subject_id", formData.subject_id)
            .eq("faculty_id", facultyRole.user_id)
            .single()

          if (facultyForm) {
            // Update existing form for this faculty
            await supabase.from("forms").update({ form: updatedFormData }).eq("id", facultyForm.id)
          } else {
            // Create new form for this faculty
            await supabase.from("forms").insert({
              faculty_id: facultyRole.user_id,
              subject_id: formData.subject_id,
              form: updatedFormData,
            })
          }
        }
      }
    } else {
      console.log("📝 Creating new shared forms for all faculty...")

      // Create forms for all faculty teaching this subject
      const formsToInsert = allFaculty.map((facultyRole) => ({
        faculty_id: facultyRole.user_id,
        subject_id: formData.subject_id,
        form: formDataToSave,
      }))

      result = await supabase.from("forms").insert(formsToInsert)
    }

    if (result.error) {
      console.error("Error saving shared form:", result.error)
      return { success: false, error: result.error.message }
    }

    // Update lesson plan status for the current faculty
    const { error: statusUpdateError } = await supabase
      .from("subjects")
      .update({ lesson_plan_status: "in_progress" })
      .eq("id", formData.subject_id)

    if (statusUpdateError) {
      console.error("❌ Error updating subject status:", statusUpdateError)
    } else {
      console.log("✅ Subject lesson plan status updated to in_progress")
    }

    revalidatePath("/dashboard/lesson-plans")
    return { success: true, message: "Shared general details saved successfully!" }
  } catch (error) {
    console.error("Unexpected error saving shared general details form:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    }
  }
}
