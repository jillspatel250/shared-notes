"use server"

import { createClient } from "@/utils/supabase/server"

export const debugFormData = async (lessonPlanId: string, subjectId: string, facultyId: string) => {
  try {
    const supabase = await createClient()

    console.log("🔍 DEBUG: Starting form data debug")
    console.log("📋 Input params:", { lessonPlanId, subjectId, facultyId })

    // 1. Check lesson plan data
    const { data: lessonPlanData, error: lpError } = await supabase
      .from("lesson_plans")
      .select("*")
      .eq("id", lessonPlanId)
      .single()

    console.log("📊 Lesson Plan Data:", lessonPlanData)
    if (lpError) console.error("❌ Lesson Plan Error:", lpError)

    // 2. Check subject data
    const { data: subjectData, error: subjectError } = await supabase
      .from("subjects")
      .select("*")
      .eq("id", subjectId)
      .single()

    console.log("📚 Subject Data:", subjectData)
    if (subjectError) console.error("❌ Subject Error:", subjectError)

    // 3. Check forms data
    const { data: formsData, error: formsError } = await supabase
      .from("forms")
      .select("*")
      .eq("subject_id", subjectId)
      .eq("faculty_id", facultyId)

    console.log("📝 Forms Data:", formsData)
    if (formsError) console.error("❌ Forms Error:", formsError)

    // 4. Check user_role data for shared faculty
    const { data: userRoleData, error: userRoleError } = await supabase
      .from("user_role")
      .select("*")
      .eq("subject_id", subjectId)
      .eq("role_name", "Faculty")

    console.log("👥 User Role Data:", userRoleData)
    if (userRoleError) console.error("❌ User Role Error:", userRoleError)

    // 5. Check all forms for this subject
    const { data: allFormsData, error: allFormsError } = await supabase
      .from("forms")
      .select("*, users!forms_faculty_id_fkey(name, email)")
      .eq("subject_id", subjectId)

    console.log("📋 All Forms Data:", allFormsData)
    if (allFormsError) console.error("❌ All Forms Error:", allFormsError)

    return {
      success: true,
      data: {
        lessonPlan: lessonPlanData,
        subject: subjectData,
        forms: formsData,
        userRoles: userRoleData,
        allForms: allFormsData,
      },
    }
  } catch (error) {
    console.error("💥 Debug Error:", error)
    return { success: false, error: error.message }
  }
}
