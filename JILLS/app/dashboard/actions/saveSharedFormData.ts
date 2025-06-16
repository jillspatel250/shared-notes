"use server"

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"

export async function saveSharedFormData(subjectId: string, formType: string, formData: any) {
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
      .eq("subject_id", subjectId)
      .eq("role_name", "Faculty")

    if (facultyError) {
      console.error("Error fetching faculty:", facultyError)
      return { success: false, error: "Failed to fetch faculty list" }
    }

    console.log("👥 All faculty for subject:", allFaculty)

    // Prepare the form data with timestamp
    const formDataToSave = {
      ...formData,
      last_updated_by: faculty_id,
      last_updated_at: new Date().toISOString(),
    }

    // Check if any form exists for this subject (from any faculty)
    const { data: existingForms, error: fetchError } = await supabase
      .from("forms")
      .select("id, form, faculty_id")
      .eq("subject_id", subjectId)
      .limit(1)

    let result

    if (existingForms && existingForms.length > 0) {
      console.log("📝 Updating existing shared forms...")

      // Update the existing form with new data
      const existingFormData = existingForms[0].form || {}
      const updatedFormData = {
        ...existingFormData,
        [formType]: formDataToSave,
      }

      // Update all forms for this subject
      result = await supabase
        .from("forms")
        .update({
          form: updatedFormData,
        })
        .eq("subject_id", subjectId)

      // Create forms for any faculty that don't have one yet
      for (const facultyRole of allFaculty) {
        const { data: facultyForm } = await supabase
          .from("forms")
          .select("id")
          .eq("subject_id", subjectId)
          .eq("faculty_id", facultyRole.user_id)
          .single()

        if (!facultyForm) {
          // Create new form for this faculty
          await supabase.from("forms").insert({
            faculty_id: facultyRole.user_id,
            subject_id: subjectId,
            form: updatedFormData,
          })
        }
      }
    } else {
      console.log("📝 Creating new shared forms for all faculty...")

      // Create forms for all faculty teaching this subject
      const formsToInsert = allFaculty.map((facultyRole) => ({
        faculty_id: facultyRole.user_id,
        subject_id: subjectId,
        form: {
          [formType]: formDataToSave,
        },
      }))

      result = await supabase.from("forms").insert(formsToInsert)
    }

    if (result.error) {
      console.error("Error saving shared form:", result.error)
      return { success: false, error: result.error.message }
    }

    revalidatePath("/dashboard/lesson-plans")
    return { success: true, message: "Shared form data saved successfully!" }
  } catch (error) {
    console.error("Unexpected error saving shared form data:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    }
  }
}
