"use server"

import { createClient } from "@/utils/supabase/server"

export const loadSharedFormData = async (subjectId: string, facultyId: string) => {
  try {
    const supabase = await createClient()

    console.log("🔍 Loading shared form data for subject:", subjectId)

    // Get any form for this subject (since they should all be the same)
    const { data: sharedForm, error: formError } = await supabase
      .from("forms")
      .select("*, users!forms_faculty_id_fkey(name, email)")
      .eq("subject_id", subjectId)
      .limit(1)
      .single()

    if (formError && formError.code !== "PGRST116") {
      console.error("Error fetching shared form:", formError)
      return { success: false, error: "Failed to fetch shared form" }
    }

    // Get all faculty teaching this subject
    const { data: allFaculty, error: facultyError } = await supabase
      .from("user_role")
      .select("user_id, users!user_role_user_id_fkey(name, email)")
      .eq("subject_id", subjectId)
      .eq("role_name", "Faculty")

    if (facultyError) {
      console.error("Error fetching faculty:", facultyError)
      return { success: false, error: "Failed to fetch faculty list" }
    }

    console.log("👥 All faculty for subject:", allFaculty)

    const isShared = allFaculty && allFaculty.length > 1

    return {
      success: true,
      isShared,
      formData: sharedForm || null,
      allFaculty: allFaculty || [],
      facultyCount: allFaculty?.length || 0,
    }
  } catch (error) {
    console.error("Error in loadSharedFormData:", error)
    return { success: false, error: "Internal server error" }
  }
}
