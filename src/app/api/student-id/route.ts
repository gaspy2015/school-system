import { revalidate } from "@/app/class/add/page"
import { TStudentID } from "@/app/student/print-id/page"
import { db } from "@/database/db"
import { enrolled_students, grade_levels, sections, students } from "@/database/schema"
import { and, asc, eq, ne, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: Request) { 
  const body : {enrolled_id : number}= await request.json()

  try {
    const updateIdPaid = await db.update(enrolled_students).set({
      is_id_paid : true
    }).where(eq(enrolled_students.enrolled_student_id, body.enrolled_id))
    revalidatePath('/student/print-id')
    return Response.json({student_enrolled_id : body.enrolled_id})
  } catch (error) {
    return Response.error()
  }
}

export async function GET(request: NextRequest) { 
  const id = request.nextUrl.searchParams.getAll('id')
  if(id.length <= 0) return NextResponse.json([])
  try {
    const getStudentInfo = await db.select(
    {
      id : sql<number>`${students.student_id}`.as('id'),
      lrn : sql<string>`${students.lrn}`.as('lrn'),
      first_name : sql<string>`${students.first_name}`.as('first_name'),
      last_name : sql<string>`${students.last_name}`.as('last_name'),
      middle_name : sql<string>`${students.middle_name}`.as('middle_name'),
      // enrollment_id : sql<string>`COALESCE(${enrolled_students.enrolled_student_id}, -1)`.as('enrollment_id'),
      enrolled_id :  sql<number>`enrolled_students.enrolled_student_id`.as('enrolled_id'),
      grade_level_name : sql<string>`COALESCE(${grade_levels.level_name}, '')`.as('grade_level_name'),
      section_name : sql<string>`COALESCE(${sections.section_name}, '')`.as('section_name'),
      enrolled_year : sql<string>`COALESCE(${enrolled_students.school_year}, '')`.as('enrolled_year'),
      is_id_paid : sql<boolean>`${enrolled_students.is_id_paid}`.as('is_id_paid'),
      parent_number : sql<string>`${students.parent_mobile_number}`.as('parent_number')
    })
    .from(students)
    .leftJoin(enrolled_students, eq(students.student_id, enrolled_students.student_id))
    .leftJoin(grade_levels, eq(enrolled_students.grade_level_id, grade_levels.grade_level_id))
    .leftJoin(sections, eq(sections.section_id, enrolled_students.section_id))
    .orderBy(asc(sections.school_year)).where(sql`${enrolled_students.enrolled_student_id} in ${id}`)
    

    const formatStudent : TStudentID[] = getStudentInfo.map(s => ({
      id : s.id,
      lrn : s.lrn,
      full_name : `${s.last_name}, ${s.first_name} .${s.middle_name?.at(0)}`,
      grade_level : s.grade_level_name,
      parent_number : s.parent_number,
      section : s.section_name,
      is_paid_id : s.is_id_paid,
      year_enrolled : s.enrolled_year,
      enrolled_id : s.enrolled_id
    }))

    return NextResponse.json(formatStudent)

  } catch (error) {
    console.log(error)
    return NextResponse.error()
  }
  
}



