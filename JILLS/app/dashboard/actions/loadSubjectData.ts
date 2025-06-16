"use server"

import { createClient } from "@/utils/supabase/server"

export const loadSubjectData = async (subjectId: string) => {
  try {
    const supabase = await createClient()

    console.log("🔍 Loading subject data for:", subjectId)

    // Get subject data directly from subjects table
    const { data: subjectData, error: subjectError } = await supabase
      .from("subjects")
      .select("*")
      .eq("id", subjectId)
      .single()

    if (subjectError) {
      console.error("Error fetching subject data:", subjectError)
      return { success: false, error: "Failed to fetch subject data" }
    }

    console.log("📊 Subject data loaded:", subjectData)

    return {
      success: true,
      data: {
        credits: subjectData.credits || 0,
        lecture_hours: subjectData.lecture_hours || 0,
        lab_hours: subjectData.lab_hours || 0,
        name: subjectData.name,
        code: subjectData.code,
        semester: subjectData.semester,
        is_theory: subjectData.is_theory,
        is_practical: subjectData.is_practical,
        metadata: subjectData.metadata,
      },
    }
  } catch (error) {
    console.error("Error in loadSubjectData:", error)
    return { success: false, error: "Internal server error" }
  }
}
